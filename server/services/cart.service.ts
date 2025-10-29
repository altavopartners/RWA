// services/cart.service.ts
import prisma from "../lib/prisma";

export async function getMyCartItems(userId: string) {
  return prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });
}

export async function addCartItem(opts: {
  userId: string;
  productId: number;
  quantity: number;
}) {
  const { userId, productId, quantity } = opts;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  const minOrder = Math.max(1, product.minOrderQty ?? 1);
  const available = Math.max(0, product.quantity ?? 0);

  if (quantity < minOrder) throw new Error(`Min order is ${minOrder}`);
  if (quantity > available) throw new Error("Not enough stock");

  await prisma.cartItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: { quantity: { increment: quantity } },
    create: { userId, productId, quantity },
  });

  return prisma.cartItem.findUniqueOrThrow({
    where: { userId_productId: { userId, productId } },
    include: { product: true },
  });
}

export async function updateCartItem(opts: {
  userId: string;
  cartItemId: string;
  change: number; // +1 or -1
}) {
  const { userId, cartItemId, change } = opts;

  const item = await prisma.cartItem.findFirst({
    where: { id: cartItemId, userId },
    include: { product: true },
  });

  if (!item) throw new Error("Item not in cart");

  const newQty = item.quantity + change;
  if (newQty <= 0) {
    await prisma.cartItem.delete({ where: { id: cartItemId } });
    return null; // removed from cart
  }

  return prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity: newQty },
    include: { product: true },
  });
}

export async function deleteCartItem(opts: { userId: string; cartItemId: string }) {
  const { userId, cartItemId } = opts;

  const item = await prisma.cartItem.findFirst({
    where: { id: cartItemId, userId },
    include: { product: true },
  });

  if (!item) throw new Error("Item not in cart");

  await prisma.cartItem.delete({ where: { id: cartItemId } });

  return item; // return last state if needed
}
