import { Router } from "express";
import {
  passOrder,
  getAllMyOrders,
  getMyOrderById,
} from "../controllers/order.controller";
import { verifyJWT } from "../middleware/auth";
import { updateOrderStatus } from "../controllers/order.controller";

const router = Router();

router.get("/pass-order", verifyJWT, passOrder);

router.get("/get-all-my-orders", verifyJWT, getAllMyOrders);

router.get("/get-my-order/:id", verifyJWT, getMyOrderById);

router.put("/:id/status", verifyJWT, updateOrderStatus);

export default router;
