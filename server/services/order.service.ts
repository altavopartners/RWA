// services/order.service.ts
import prisma from "../lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";
import { deployEscrowContract } from "./escrow-deploy.service";
import debug from "../utils/debug";

class CheckoutError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "CheckoutError";
    this.status = status;
  }
}

type PassOrderOptions = {
  userId: string;
  shipping?: number;
};

// ---------- Order Code Generator ----------
async function generateOrderCode(
  tx: Prisma.TransactionClient
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const startOfNextYear = new Date(year + 1, 0, 1);

  const yearlyCount = await tx.order.count({
    where: { createdAt: { gte: startOfYear, lt: startOfNextYear } },
  });

  const padded = String(yearlyCount + 1).padStart(6, "0");
  return `ORD-${year}-${padded}`;
}

// ---------- Create Order from Cart ----------
export async function passOrderService({
  userId,
  shipping = 5.0,
}: PassOrderOptions) {
  return prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const cartItems = await tx.cartItem.findMany({
        where: { userId },
        include: { product: true },
      });

      if (cartItems.length === 0) {
        throw new CheckoutError("Your cart is empty.", 400);
      }

      for (const ci of cartItems) {
        if (ci.quantity <= 0) {
          throw new CheckoutError(
            `Invalid quantity for product ${ci.productId}.`,
            400
          );
        }
        if (ci.product.quantity < ci.quantity) {
          throw new CheckoutError(
            `Insufficient stock for "${ci.product.name}".`,
            409
          );
        }
      }

      // Ensure buyer exists
      const buyerExists = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!buyerExists) {
        throw new CheckoutError("Buyer not found.", 404);
      }

      // Extract unique producer wallet IDs from cart items
      const producerWalletIds = [
        ...new Set(
          cartItems
            .map((ci: any) => ci.product.producerWalletId)
            .filter((id: any): id is string => !!id)
        ),
      ];

      if (producerWalletIds.length === 0) {
        throw new CheckoutError(
          "Products missing producer information. Cannot process order.",
          400
        );
      }

      // For now, support single-seller orders only
      if (producerWalletIds.length > 1) {
        throw new CheckoutError(
          "Multi-seller orders not supported yet. Please order from one producer at a time.",
          400
        );
      }

      // Ensure the seller (producer) exists. If the DB doesn't have a user
      // marked as PRODUCER for this wallet, fall back to any user with the
      // walletAddress. If no user exists, create a minimal producer user.
      const requestedWallet = producerWalletIds[0] as string;

      let sellerRecord = await tx.user.findFirst({
        where: {
          walletAddress: requestedWallet,
          userType: "PRODUCER",
        },
        select: { id: true, walletAddress: true, userType: true },
      });

      let sellerId: string | null = null;

      if (!sellerRecord) {
        // Try any user with the walletAddress (maybe user exists but not labeled PRODUCER)
        const anyUser = await tx.user.findUnique({
          where: { walletAddress: requestedWallet },
          select: { id: true, userType: true },
        });

        if (anyUser) {
          console.warn(
            `⚠️  Order: wallet ${requestedWallet} found but not marked PRODUCER; using existing user ${anyUser.id} as producer.`
          );
          sellerId = anyUser.id;
        } else {
          // No user at all — create a minimal producer user so orders can proceed.
          // This keeps the system working while allowing the admin or producer to
          // update profile details later. Wallet address is unique so this should be safe.
          const created = await tx.user.create({
            data: {
              walletAddress: requestedWallet,
              userType: "PRODUCER",
            },
            select: { id: true },
          });
          console.warn(
            `⚠️  Auto-created producer user ${created.id} for wallet ${requestedWallet}`
          );
          sellerId = created.id;
        }
      } else {
        sellerId = sellerRecord.id;
      }

      if (!sellerId) {
        throw new CheckoutError(
          "Producer not found for this order. Contact support.",
          404
        );
      }

      // Assign banks: use any configured bank (demo-friendly fallback)
      const anyBank = await tx.bank.findFirst();
      if (!anyBank) {
        throw new CheckoutError(
          "No banks configured. Please seed or create at least one bank.",
          500
        );
      }
      const buyerBankIdToUse = anyBank.id;
      const sellerBankIdToUse = anyBank.id;

      const toDecimal = (n: number | Prisma.Decimal) => new Prisma.Decimal(n);
      const subtotal = cartItems.reduce(
        (acc: Prisma.Decimal, ci: any) =>
          acc.add(toDecimal(ci.product.pricePerUnit).mul(ci.quantity)),
        toDecimal(0)
      );
      const shippingD = toDecimal(shipping ?? 0);
      const total = subtotal.add(shippingD);

      let order: Awaited<ReturnType<typeof tx.order.create>> | null = null;
      const MAX_RETRIES = 2;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const code = await generateOrderCode(tx);
        try {
          order = await tx.order.create({
            data: {
              code,
              userId,
              status: OrderStatus.AWAITING_PAYMENT, // Start awaiting payment; move to BANK_REVIEW after on-chain payment
              subtotal,
              shipping: shippingD,
              total,
              buyerBankId: buyerBankIdToUse, // Ensure buyer's bank exists
              sellerBankId: sellerBankIdToUse, // Ensure seller's bank exists
              items: {
                create: cartItems.map((ci: any) => ({
                  productId: ci.productId,
                  quantity: ci.quantity,
                  unitPrice: toDecimal(ci.product.pricePerUnit),
                  lineTotal: toDecimal(ci.product.pricePerUnit).mul(
                    ci.quantity
                  ),
                })),
              },
            },
            include: { items: true },
          });
          break;
        } catch (err: any) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2002" &&
            Array.isArray((err.meta as any)?.target) &&
            (err.meta as any).target.includes("code")
          ) {
            if (attempt === MAX_RETRIES) {
              throw new CheckoutError(
                "Could not generate unique order code.",
                500
              );
            }
          } else throw err;
        }
      }

      if (!order)
        throw new CheckoutError("Unknown error during order creation.", 500);

      // Decrement stock
      for (const ci of cartItems) {
        const updated = await tx.product.updateMany({
          where: { id: ci.productId, quantity: { gte: ci.quantity } },
          data: { quantity: { decrement: ci.quantity } },
        });
        if (updated.count !== 1) {
          throw new CheckoutError(
            `Stock changed while checking out for "${ci.product.name}". Please retry.`,
            409
          );
        }
      }

      await tx.cartItem.deleteMany({ where: { userId } });

      // Deploy escrow contract for this order
      // (If HEDERA_PRIVATE_KEY is not set or escrow artifact is missing, skip)
      const escrowEnabled = !!process.env.HEDERA_PRIVATE_KEY;

      if (escrowEnabled) {
        try {
          const buyerUser = await tx.user.findUnique({
            where: { id: userId },
            select: { walletAddress: true },
          });

          const sellerWalletAddress = producerWalletIds[0];

          if (!buyerUser?.walletAddress) {
            debug.warn(
              `Order ${order.id}: Buyer wallet not found, skipping escrow deployment`
            );
          } else if (!sellerWalletAddress) {
            debug.warn(
              `Order ${order.id}: Seller wallet not found, skipping escrow deployment`
            );
          } else {
            debug.deploy(`Deploying escrow for order ${order.id}`);

            const escrowResult = await deployEscrowContract({
              buyerAddress: buyerUser.walletAddress,
              sellerAddress: sellerWalletAddress as string,
              totalAmount: total.toString(),
            });

            debug.deploy(
              `Escrow deployed at ${escrowResult.contractAddress} for order ${order.id}`
            );

            // Save escrow address to order
            await tx.order.update({
              where: { id: order.id },
              data: {
                escrowAddress: escrowResult.contractAddress,
                hederaTransactionId: escrowResult.transactionHash,
              },
            });
          }
        } catch (escrowError: any) {
          // Log error but don't fail order creation
          debug.error(
            `Failed to deploy escrow for order ${order.id}:`,
            escrowError
          );
          // Order is still created, escrow can be deployed manually later
        }
      }

      return order;
    },
    {
      timeout: 60000, // 60 seconds for escrow deployment
    }
  );
}

// ---------- Get All My Orders ----------
type GetAllMyOrdersOptions = {
  userId: string;
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
};

export async function getAllMyOrdersService({
  userId,
  page = 1,
  pageSize = 20,
  status,
}: GetAllMyOrdersOptions) {
  const take = Math.min(Math.max(pageSize, 1), 100);
  const skip = Math.max(page - 1, 0) * take;

  const where: Prisma.OrderWhereInput = {
    userId,
    ...(status ? { status } : {}),
  };

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { items: { include: { product: true } }, documents: true },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    page,
    pageSize: take,
    total,
    pageCount: Math.max(1, Math.ceil(total / take)),
  };
}

// ---------- Update Order Status ----------
export async function updateOrderStatusService({
  orderId,
  status,
  userId,
}: {
  orderId: string;
  status: OrderStatus;
  userId: string;
}) {
  // Verify order belongs to user
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
  });

  if (!order) {
    throw new CheckoutError("Order not found.", 404);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: { items: true, documents: true },
  });

  return updatedOrder;
}

// ---------- Get My Order By ID ----------
export async function getMyOrderByIdService({
  userId,
  id,
}: {
  userId: string;
  id: string;
}) {
  const order = await prisma.order.findFirst({
    where: { id, userId },
    include: { items: { include: { product: true } }, documents: true },
  });

  if (!order) throw new CheckoutError("Order not found.", 404);
  return order;
}

export { CheckoutError };
