// services/cart.service.ts
import prisma from "../lib/prisma";

type UpdateMode = "increment" | "set";

export async function getMyCartItems(userId: string) {
  return prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });
}

export async function addOrUpdateCartItem(opts: {
  userId: string;
  productId: number;
  quantity: number;
  mode?: UpdateMode; // "increment" (default) | "set"
}) {
  const { userId, productId, quantity, mode = "increment" } = opts;

  // 1) Read product (authoritative for stock/min)
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  const minOrder = Math.max(1, product.minOrderQty ?? 1);
  const available = Math.max(0, product.quantity ?? 0);

  if (quantity < minOrder) throw new Error(`Min order is ${minOrder}`);
  if (quantity > available) throw new Error("Not enough stock");

  // 2) Upsert cart item (no unitPrice on CartItem in your schema)
  const item =
    mode === "increment"
      ? await prisma.cartItem.upsert({
          where: { userId_productId: { userId, productId } },
          update: { quantity: { increment: quantity } },
          create: { userId, productId, quantity },
        })
      : await prisma.cartItem.upsert({
          where: { userId_productId: { userId, productId } },
          update: { quantity },
          create: { userId, productId, quantity },
        });

  // 3) Return with product details for UI
  return prisma.cartItem.findUniqueOrThrow({
    where: { userId_productId: { userId, productId } },
    include: { product: true },
  });
}
