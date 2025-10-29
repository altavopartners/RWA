"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyCart = getMyCart;
exports.getMyCartCount = getMyCartCount;
exports.addItemToCart = addItemToCart;
exports.incrementItemQuantity = incrementItemQuantity;
exports.decrementItemQuantity = decrementItemQuantity;
exports.removeItemFromCart = removeItemFromCart;
const cart_service_1 = require("../services/cart.service");
const cart_service_2 = require("../services/cart.service");
// GET /api/carts/getmycart/
async function getMyCart(req, res, next) {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: "Unauthorized" });
        const userId = req.user.id;
        const cart = await (0, cart_service_1.getMyCartItems)(userId);
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        // ✅ Correction : compter le nombre de lignes (items.length)
        const __count = Array.isArray(cart?.items)
            ? cart.items.length
            : 0;
        cart.count = __count;
        res.json(cart);
        console.log(__count);
    }
    catch (err) {
        next(err);
    }
}
// GET /api/carts/getmycartcount/
async function getMyCartCount(req, res, next) {
    try {
        if (!req.user)
            return res.status(200).json({ cartcount: 0 });
        const userId = req.user.id;
        const cart = await (0, cart_service_1.getMyCartItems)(userId);
        if (!cart) {
            return res.status(200).json({ cartcount: 0 });
        }
        res.json({ cartcount: cart.length });
    }
    catch (err) {
        next(err);
    }
}
async function addItemToCart(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const userId = req.user.id;
        const { idofproduct, qty } = req.body ?? {};
        const productId = Number(idofproduct);
        const quantity = Number(qty);
        if (!Number.isFinite(productId) || productId <= 0) {
            return res.status(400).json({ success: false, message: "Invalid product id" });
        }
        if (!Number.isFinite(quantity) || quantity < 1) {
            return res.status(400).json({ success: false, message: "Invalid quantity" });
        }
        const item = await (0, cart_service_2.addCartItem)({ userId, productId, quantity });
        const __myCart = await (0, cart_service_1.getMyCartItems)(userId);
        const __count = Array.isArray(__myCart?.items)
            ? __myCart.items.length
            : 0;
        return res.status(201).json({ success: true, item, count: __count });
    }
    catch (err) {
        if (err?.message?.startsWith("Min order") ||
            err?.message === "Not enough stock" ||
            err?.message === "Product not found") {
            return res.status(400).json({ success: false, message: err.message });
        }
        next(err);
    }
}
/**
 * POST /api/carts/increment
 * Body: { cartItemId: string }
 */
async function incrementItemQuantity(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const userId = req.user.id;
        const { cartItemId } = req.body ?? {};
        if (!cartItemId || typeof cartItemId !== "string") {
            return res.status(400).json({ success: false, message: "Invalid cart item id" });
        }
        const item = await (0, cart_service_2.updateCartItem)({ userId, cartItemId, change: 1 });
        const __myCart = await (0, cart_service_1.getMyCartItems)(userId);
        const __count = Array.isArray(__myCart?.items)
            ? __myCart.items.length
            : 0;
        return res.status(200).json({ success: true, item, count: __count });
    }
    catch (err) {
        if (err?.message?.startsWith("Min order") ||
            err?.message === "Not enough stock" ||
            err?.message === "Product not found" ||
            err?.message === "Item not in cart") {
            return res.status(400).json({ success: false, message: err.message });
        }
        next(err);
    }
}
/**
 * POST /api/carts/decrement
 * Body: { cartItemId: string }
 */
async function decrementItemQuantity(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const userId = req.user.id;
        const { cartItemId } = req.body ?? {};
        if (!cartItemId || typeof cartItemId !== "string") {
            return res.status(400).json({ success: false, message: "Invalid cart item id" });
        }
        const item = await (0, cart_service_2.updateCartItem)({ userId, cartItemId, change: -1 });
        const __myCart = await (0, cart_service_1.getMyCartItems)(userId);
        const __count = Array.isArray(__myCart?.items)
            ? __myCart.items.length
            : 0;
        return res.status(200).json({ success: true, item, count: __count });
    }
    catch (err) {
        if (err?.message === "Product not found" || err?.message === "Item not in cart") {
            return res.status(404).json({ success: false, message: err.message });
        }
        if (err?.message?.startsWith("Min order")) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next(err);
    }
}
async function removeItemFromCart(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const userId = req.user.id;
        const { cartItemId } = req.body ?? {};
        if (!cartItemId || typeof cartItemId !== "string") {
            return res
                .status(400)
                .json({ success: false, message: "Invalid cart item id" });
        }
        const deleted = await (0, cart_service_2.deleteCartItem)({ userId, cartItemId });
        const myCart = await (0, cart_service_1.getMyCartItems)(userId);
        const count = Array.isArray(myCart) ? myCart.length : 0;
        return res.status(200).json({
            success: true,
            deleted, // last state of removed item (optional for UI feedback)
            count,
        });
    }
    catch (err) {
        if (err?.message === "Item not in cart") {
            return res.status(404).json({ success: false, message: err.message });
        }
        next(err);
    }
}
//# sourceMappingURL=cart.controller.js.map