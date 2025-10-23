"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyCartItems = getMyCartItems;
exports.addCartItem = addCartItem;
exports.updateCartItem = updateCartItem;
exports.deleteCartItem = deleteCartItem;
// services/cart.service.ts
const prisma_1 = __importDefault(require("../lib/prisma"));
async function getMyCartItems(userId) {
    return prisma_1.default.cartItem.findMany({
        where: { userId },
        include: { product: true },
    });
}
async function addCartItem(opts) {
    const { userId, productId, quantity } = opts;
    const product = await prisma_1.default.product.findUnique({ where: { id: productId } });
    if (!product)
        throw new Error("Product not found");
    const minOrder = Math.max(1, product.minOrderQty ?? 1);
    const available = Math.max(0, product.quantity ?? 0);
    if (quantity < minOrder)
        throw new Error(`Min order is ${minOrder}`);
    if (quantity > available)
        throw new Error("Not enough stock");
    await prisma_1.default.cartItem.upsert({
        where: { userId_productId: { userId, productId } },
        update: { quantity: { increment: quantity } },
        create: { userId, productId, quantity },
    });
    return prisma_1.default.cartItem.findUniqueOrThrow({
        where: { userId_productId: { userId, productId } },
        include: { product: true },
    });
}
async function updateCartItem(opts) {
    const { userId, cartItemId, change } = opts;
    const item = await prisma_1.default.cartItem.findFirst({
        where: { id: cartItemId, userId },
        include: { product: true },
    });
    if (!item)
        throw new Error("Item not in cart");
    const newQty = item.quantity + change;
    if (newQty <= 0) {
        await prisma_1.default.cartItem.delete({ where: { id: cartItemId } });
        return null; // removed from cart
    }
    return prisma_1.default.cartItem.update({
        where: { id: cartItemId },
        data: { quantity: newQty },
        include: { product: true },
    });
}
async function deleteCartItem(opts) {
    const { userId, cartItemId } = opts;
    const item = await prisma_1.default.cartItem.findFirst({
        where: { id: cartItemId, userId },
        include: { product: true },
    });
    if (!item)
        throw new Error("Item not in cart");
    await prisma_1.default.cartItem.delete({ where: { id: cartItemId } });
    return item; // return last state if needed
}
//# sourceMappingURL=cart.service.js.map