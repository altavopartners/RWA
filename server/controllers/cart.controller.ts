import { Request, Response, NextFunction } from 'express';
import { getMyCartItems } from '../services/cart.service';
import { AuthenticatedRequest } from "../types/auth";
import { addCartItem, updateCartItem, deleteCartItem } from "../services/cart.service";

// GET /api/carts/getmycart/
export async function getMyCart(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    const userId = req.user.id;
    const cart = await getMyCartItems(userId);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // ✅ Correction : compter le nombre de lignes (items.length)
    const __count =
      Array.isArray((cart as any)?.items)
        ? (cart as any).items.length
        : 0;
    (cart as any).count = __count;

    res.json(cart);
    console.log(__count);
  } catch (err) {
    next(err);
  }
}

// GET /api/carts/getmycartcount/
export async function getMyCartCount(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user)
      return res.status(200).json({ cartcount: 0  });
    const userId = req.user.id;
    const cart = await getMyCartItems(userId);
    if (!cart) {
      return res.status(200).json({ cartcount: 0 });
    }

    res.json({ cartcount: cart.length });
  } catch (err) {
    next(err);
  }
}



export async function addItemToCart(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
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

    const item = await addCartItem({ userId, productId, quantity });

    const __myCart = await getMyCartItems(userId);
    const __count = Array.isArray((__myCart as any)?.items)
      ? (__myCart as any).items.length
      : 0;

    return res.status(201).json({ success: true, item, count: __count });
  } catch (err: any) {
    if (
      err?.message?.startsWith("Min order") ||
      err?.message === "Not enough stock" ||
      err?.message === "Product not found"
    ) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
}

/**
 * POST /api/carts/increment
 * Body: { cartItemId: string }
 */
export async function incrementItemQuantity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = req.user.id;
    const { cartItemId } = req.body ?? {};

    if (!cartItemId || typeof cartItemId !== "string") {
      return res.status(400).json({ success: false, message: "Invalid cart item id" });
    }

    const item = await updateCartItem({ userId, cartItemId, change: 1 });

    const __myCart = await getMyCartItems(userId);
    const __count = Array.isArray((__myCart as any)?.items)
      ? (__myCart as any).items.length
      : 0;

    return res.status(200).json({ success: true, item, count: __count });
  } catch (err: any) {
    if (
      err?.message?.startsWith("Min order") ||
      err?.message === "Not enough stock" ||
      err?.message === "Product not found" ||
      err?.message === "Item not in cart"
    ) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
}

/**
 * POST /api/carts/decrement
 * Body: { cartItemId: string }
 */
export async function decrementItemQuantity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = req.user.id;
    const { cartItemId } = req.body ?? {};

    if (!cartItemId || typeof cartItemId !== "string") {
      return res.status(400).json({ success: false, message: "Invalid cart item id" });
    }

    const item = await updateCartItem({ userId, cartItemId, change: -1 });

    const __myCart = await getMyCartItems(userId);
    const __count = Array.isArray((__myCart as any)?.items)
      ? (__myCart as any).items.length
      : 0;

    return res.status(200).json({ success: true, item, count: __count });
  } catch (err: any) {
    if (err?.message === "Product not found" || err?.message === "Item not in cart") {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (err?.message?.startsWith("Min order")) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
}

export async function removeItemFromCart(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
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

    const deleted = await deleteCartItem({ userId, cartItemId });

    const myCart = await getMyCartItems(userId);
    const count = Array.isArray(myCart) ? myCart.length : 0;

    return res.status(200).json({
      success: true,
      deleted, // last state of removed item (optional for UI feedback)
      count,
    });
  } catch (err: any) {
    if (err?.message === "Item not in cart") {
      return res.status(404).json({ success: false, message: err.message });
    }
    next(err);
  }
}
