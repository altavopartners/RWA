// controllers/cart.controller.ts (or wherever your route handler lives)
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { passOrderService, CheckoutError } from "../services/order.service";

// POST /api/carts/pass-order
export async function passOrder(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // optional: allow client to send shipping amount
    const shipping = typeof req.body?.shipping === "number" ? req.body.shipping : undefined;

    const order = await passOrderService({
      userId: req.user.id,
      shipping,
    });

    return res.status(201).json({ success: true, order });
  } catch (err: any) {
    if (err instanceof CheckoutError) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    // Prisma validation / other errors
    if (err?.code === "P2003") {
      // foreign key error example
      return res.status(400).json({ success: false, message: "Invalid reference." });
    }
    next(err);
  }
}
