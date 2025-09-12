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
    const order = await tx.order.create({
      data: {
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
      include: {
        items: true,
      },
    });

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
            // include only what you need; keeping it simple here
            product: true,
          },
        },
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
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    throw new CheckoutError("Order not found.", 404);
  }

  return order;
}