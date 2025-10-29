// controllers/cart.controller.ts
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { OrderStatus } from "@prisma/client";
import { updateOrderStatusService } from "../services/order.service";
import {
  passOrderService,
  CheckoutError,
  getAllMyOrdersService,
  getMyOrderByIdService,
} from "../services/order.service";

// POST /api/carts/pass-order
export async function passOrder(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const shipping =
      typeof req.body?.shipping === "number" ? req.body.shipping : undefined;

    const order = await passOrderService({ userId: req.user.id, shipping });
    return res.status(201).json({ success: true, order });
  } catch (err: any) {
    if (err instanceof CheckoutError)
      return res
        .status(err.status)
        .json({ success: false, message: err.message });
    next(err);
  }
}

// GET /api/carts/get-all-my-orders
export async function getAllMyOrders(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 20);
    const statusQ = req.query.status as string | undefined;

    let status: OrderStatus | undefined = undefined;
    if (statusQ) {
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
      page,
      pageSize,
      status,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (err: any) {
    next(err);
  }
}

// PUT /api/orders/:id/status
export async function updateOrderStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    console.log("PUT /orders/:id/status called");
    console.log("Params:", req.params);
    console.log("Body:", req.body);
    console.log("Logged-in user:", req.user?.id);

    if (!req.user)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const { status } = req.body;
    const orderId = req.params.id;

    if (!status || !Object.values(OrderStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${Object.values(OrderStatus).join(
          ", "
        )}`,
      });
    }

    const updatedOrder = await updateOrderStatusService({
      orderId,
      status,
      userId: req.user.id,
    });

    console.log("Order updated successfully:", updatedOrder.id);

    return res.status(200).json({ success: true, order: updatedOrder });
  } catch (err: any) {
    if (err instanceof CheckoutError)
      return res
        .status(err.status)
        .json({ success: false, message: err.message });

    console.error("Error in updateOrderStatus:", err);
    next(err);
  }
}

// GET /api/carts/get-my-order/:id
export async function getMyOrderById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const order = await getMyOrderByIdService({
      userId: req.user.id,
      id: req.params.id,
    });
    return res.status(200).json({ success: true, order });
  } catch (err: any) {
    if (err instanceof CheckoutError)
      return res
        .status(err.status)
        .json({ success: false, message: err.message });
    next(err);
  }
}

// GET /api/orders/:orderId/documents
export async function getOrderDocuments(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const { orderId } = req.params;
    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, message: "orderId required" });
    }

    const { prisma } = await import("../utils/prisma");
    const documents = await prisma.document.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, documents });
  } catch (err: any) {
    next(err);
  }
}
