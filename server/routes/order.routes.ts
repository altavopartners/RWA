import { Router } from "express";
import {
  passOrder,
  getAllMyOrders,
  getMyOrderById,
  updateOrderStatus,
  getOrderDocuments,
} from "../controllers/order.controller";
import { verifyJWT } from "../middleware/auth";

const router = Router();

router.get("/pass-order", verifyJWT, passOrder);

router.get("/get-all-my-orders", verifyJWT, getAllMyOrders);

router.get("/get-my-order/:id", verifyJWT, getMyOrderById);

router.get("/:orderId/documents", verifyJWT, getOrderDocuments);

router.put("/:id/status", verifyJWT, updateOrderStatus);

export default router;
