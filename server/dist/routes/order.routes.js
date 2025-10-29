"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get("/pass-order", auth_1.verifyJWT, order_controller_1.passOrder);
router.get("/get-all-my-orders", auth_1.verifyJWT, order_controller_1.getAllMyOrders);
router.get("/get-my-order/:id", auth_1.verifyJWT, order_controller_1.getMyOrderById);
router.get("/:orderId/documents", auth_1.verifyJWT, order_controller_1.getOrderDocuments);
router.put("/:id/status", auth_1.verifyJWT, order_controller_1.updateOrderStatus);
exports.default = router;
//# sourceMappingURL=order.routes.js.map