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
  return prisma.$transaction(async (tx) => {
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

    const toDecimal = (n: number | Prisma.Decimal) => new Prisma.Decimal(n);
    const subtotal = cartItems.reduce(
      (acc, ci) => acc.add(toDecimal(ci.product.pricePerUnit).mul(ci.quantity)),
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
            status: OrderStatus.AWAITING_PAYMENT,
            subtotal,
            shipping: shippingD,
            total,
            items: {
              create: cartItems.map((ci) => ({
                productId: ci.productId,
                quantity: ci.quantity,
                unitPrice: toDecimal(ci.product.pricePerUnit),
                lineTotal: toDecimal(ci.product.pricePerUnit).mul(ci.quantity),
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
    return order;
  });
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
  // TEMP: log for debugging
  console.log("Service: updateOrderStatusService", { orderId, userId, status });

  // Verify order belongs to user
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
  });

  if (!order) {
    console.log("Order not found or user mismatch in DB");
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
