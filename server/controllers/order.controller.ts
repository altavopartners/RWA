// controllers/cart.controller.ts (or wherever your route handler lives)
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { OrderStatus } from "@prisma/client";
import { passOrderService, CheckoutError, getAllMyOrdersService, getMyOrderByIdService } from "../services/order.service";

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


/** GET /api/carts/get-all-my-orders */
export async function getAllMyOrders(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const statusQ = req.query.status as string | undefined;

    let status: OrderStatus | undefined = undefined;
    if (statusQ) {
      // validate status string -> enum
      const values = Object.values(OrderStatus) as string[];
      if (!values.includes(statusQ)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed: ${values.join(", ")}`,
        });
      }
      status = statusQ as OrderStatus;
    }

    const result = await getAllMyOrdersService({
      userId: req.user.id,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20,
      status,
    });

    return res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    // Prisma validation / other errors
    if (err?.code === "P2003") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid reference." });
    }
    next(err);
  }
}

/** GET /api/carts/get-my-order/:id */
export async function getMyOrderById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const id = req.params.id;

    const order = await getMyOrderByIdService({
      userId: req.user.id,
      id,
    });

    return res.status(200).json({ success: true, order });
  } catch (err: any) {
    if (err instanceof CheckoutError) {
      return res
        .status(err.status)
        .json({ success: false, message: err.message });
    }
    // e.g. malformed `id` where Prisma can’t parse filter
    if (err?.code === "P2023" || err?.code === "P2025") {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }
    next(err);
  }
}