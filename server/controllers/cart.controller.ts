import { Request, Response, NextFunction } from 'express';
import { getMyCartItems } from '../services/cart.service';
import { AuthenticatedRequest } from "../types/auth";
import { addOrUpdateCartItem } from "../services/cart.service";

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

    res.json(cart);
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

    // Expect: { idofproduct, qty }
    const { idofproduct, qty } = req.body ?? {};
    const productId = Number(idofproduct);
    const quantity = Number(qty);

    if (!Number.isFinite(productId) || productId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, message: "Invalid quantity" });
    }

    const item = await addOrUpdateCartItem({
      userId,
      productId,
      quantity,          // change service mode if you want "set" instead of "increment"
      mode: "increment", // "increment" | "set"
    });

    return res.status(201).json({ success: true, item });
  } catch (err: any) {
    // you can map known error messages to 400 here if desired
    if (err?.message?.startsWith("Min order") || err?.message === "Not enough stock" || err?.message === "Product not found") {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
}