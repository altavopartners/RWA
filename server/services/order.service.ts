// services/order.service.ts
import prisma from "../lib/prisma";
import { OrderStatus, Prisma } from "@prisma/client";

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
  shipping?: number; // in order currency (e.g., USD). default 5.00
};

/**
 * Generate the next order code for the current calendar year.
 * Format: ORD-YYYY-XXXXXX (zero-padded sequence)
 *
 * NOTE: For best safety, add a unique index on Order.code in your Prisma schema:
 * model Order {
 *   id        String   @id @default(cuid())
 *   code      String   @unique
 *   // ...
 * }
 */
async function generateOrderCode(tx: Prisma.TransactionClient): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();

  const startOfYear = new Date(year, 0, 1);
  const startOfNextYear = new Date(year + 1, 0, 1);

  // Count orders in the current year
  const yearlyCount = await tx.order.count({
    where: {
      createdAt: {
        gte: startOfYear,
        lt: startOfNextYear,
      },
    },
  });

  const seq = yearlyCount + 1;
  const padded = String(seq).padStart(6, "0");
  return `ORD-${year}-${padded}`;
}

export async function passOrderService({ userId, shipping = 5.0 }: PassOrderOptions) {
  // Wrap the entire flow in a single transaction
  return prisma.$transaction(async (tx) => {
    // 1) Load cart with products
    const cartItems = await tx.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      throw new CheckoutError("Your cart is empty.", 400);
    }

    // 2) Validate quantities and stock
    for (const ci of cartItems) {
      if (ci.quantity <= 0) {
        throw new CheckoutError(`Invalid quantity for product ${ci.productId}.`, 400);
      }
      if (ci.product.quantity < ci.quantity) {
        throw new CheckoutError(
          `Insufficient stock for "${ci.product.name}". Available: ${ci.product.quantity}, requested: ${ci.quantity}.`,
          409
        );
      }
    }

    // 3) Compute totals (use Decimal to avoid float errors)
    const toDecimal = (n: number | Prisma.Decimal) => new Prisma.Decimal(n);

    const subtotal = cartItems.reduce((acc, ci) => {
      const line = toDecimal(ci.product.pricePerUnit).mul(ci.quantity);
      return acc.add(line);
    }, toDecimal(0));

    const shippingD = toDecimal(shipping ?? 0);
    const total = subtotal.add(shippingD);

    // 4) Create order + ordered items (snapshot product data)
    //    Include a tiny retry loop for unique code collisions under concurrency.
    const MAX_RETRIES = 2;
    let order: Awaited<ReturnType<typeof tx.order.create>> | null = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const code = await generateOrderCode(tx);
      try {
        order = await tx.order.create({
          data: {
            code,
            userId,
            status: OrderStatus.AWAITING_PAYMENT,
            subtotal,
            shipping: shippingD,
            total: total.mul(1.05),
            items: {
              create: cartItems.map((ci) => ({
                productId: ci.productId,
                quantity: ci.quantity,
                unitPrice: toDecimal(ci.product.pricePerUnit),
                lineTotal: toDecimal(ci.product.pricePerUnit).mul(ci.quantity),
              })),
            },
          },
          include: {
            items: true,
          },
        });
        break; // success
      } catch (err: any) {
        // If unique constraint on code failed, retry a couple times
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002" &&
          Array.isArray((err.meta as any)?.target) &&
          (err.meta as any).target.includes("code")
        ) {
          if (attempt === MAX_RETRIES) {
            throw new CheckoutError("Could not generate a unique order code. Please retry.", 500);
          }
          // continue to next attempt
        } else {
          throw err;
        }
      }
    }

    if (!order) {
      throw new CheckoutError("Unknown error during order creation.", 500);
    }

    // 5) Decrement inventory with a guard to prevent race conditions
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

    // 6) Clear the cart
    await tx.cartItem.deleteMany({ where: { userId } });

    return order;
  });
}

export { CheckoutError };

/** ---------- GET ALL MY ORDERS ---------- */
type GetAllMyOrdersOptions = {
  userId: string;
  page?: number;      // 1-based
  pageSize?: number;  // max 100
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
      include: {
        items: {
          include: {
            product: true,
          },
        },
        documents: true,
      },
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

/** ---------- GET MY ORDER BY ID ---------- */
export async function getMyOrderByIdService({
  userId,
  id,
}: {
  userId: string;
  id: string;
}) {
  const order = await prisma.order.findFirst({
    where: { id, userId }, // protection: must belong to requester
    include: {
      items: {
        include: { product: true },
      },
      documents: true, 
      
    },
  });

  if (!order) {
    throw new CheckoutError("Order not found.", 404);
  }
  return order;
}

//  ---------- DELETE MY ORDER BY ID ----------
export async function deleteMyOrderService({
  userId,
  id,
}: {
  userId: string;
  id: string;
}) {
  const order = await prisma.order.findFirst({
    where: { id, userId }, // protection: must belong to requester
  });

  if (!order) {
    throw new CheckoutError("Order not found.", 404);
  }

  await prisma.order.delete({
    where: { id },
  });
}

//  ---------- UPDATE MY ORDER STATUS BY ID ----------
export async function updateMyOrderStatusService({
  userId,
  id,
  status,
}: {
  userId: string;
  id: string;
  status: OrderStatus;
}) {
  const order = await prisma.order.findFirst({
    where: { id, userId }, // protection: must belong to requester
  });

  if (!order) {
    throw new CheckoutError("Order not found.", 404);
  }

  await prisma.order.update({
    where: { id },
    data: { status },
  });
}
