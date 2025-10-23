"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.passOrder = passOrder;
exports.getAllMyOrders = getAllMyOrders;
exports.updateOrderStatus = updateOrderStatus;
exports.getMyOrderById = getMyOrderById;
exports.getOrderDocuments = getOrderDocuments;
const client_1 = require("@prisma/client");
const order_service_1 = require("../services/order.service");
const order_service_2 = require("../services/order.service");
// POST /api/carts/pass-order
async function passOrder(req, res, next) {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: "Unauthorized" });
        const shipping = typeof req.body?.shipping === "number" ? req.body.shipping : undefined;
        const order = await (0, order_service_2.passOrderService)({ userId: req.user.id, shipping });
        return res.status(201).json({ success: true, order });
    }
    catch (err) {
        if (err instanceof order_service_2.CheckoutError)
            return res
                .status(err.status)
                .json({ success: false, message: err.message });
        next(err);
    }
}
// GET /api/carts/get-all-my-orders
async function getAllMyOrders(req, res, next) {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: "Unauthorized" });
        const page = Number(req.query.page ?? 1);
        const pageSize = Number(req.query.pageSize ?? 20);
        const statusQ = req.query.status;
        let status = undefined;
        if (statusQ) {
            const values = Object.values(client_1.OrderStatus);
            if (!values.includes(statusQ)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Allowed: ${values.join(", ")}`,
                });
            }
            status = statusQ;
        }
        const result = await (0, order_service_2.getAllMyOrdersService)({
            userId: req.user.id,
            page,
            pageSize,
            status,
        });
        return res.status(200).json({ success: true, ...result });
    }
    catch (err) {
        next(err);
    }
}
// PUT /api/orders/:id/status
async function updateOrderStatus(req, res, next) {
    try {
        console.log("PUT /orders/:id/status called");
        console.log("Params:", req.params);
        console.log("Body:", req.body);
        console.log("Logged-in user:", req.user?.id);
        if (!req.user)
            return res.status(401).json({ success: false, message: "Unauthorized" });
        const { status } = req.body;
        const orderId = req.params.id;
        if (!status || !Object.values(client_1.OrderStatus).includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed: ${Object.values(client_1.OrderStatus).join(", ")}`,
            });
        }
        const updatedOrder = await (0, order_service_1.updateOrderStatusService)({
            orderId,
            status,
            userId: req.user.id,
        });
        console.log("Order updated successfully:", updatedOrder.id);
        return res.status(200).json({ success: true, order: updatedOrder });
    }
    catch (err) {
        if (err instanceof order_service_2.CheckoutError)
            return res
                .status(err.status)
                .json({ success: false, message: err.message });
        console.error("Error in updateOrderStatus:", err);
        next(err);
    }
}
// GET /api/carts/get-my-order/:id
async function getMyOrderById(req, res, next) {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: "Unauthorized" });
        const order = await (0, order_service_2.getMyOrderByIdService)({
            userId: req.user.id,
            id: req.params.id,
        });
        return res.status(200).json({ success: true, order });
    }
    catch (err) {
        if (err instanceof order_service_2.CheckoutError)
            return res
                .status(err.status)
                .json({ success: false, message: err.message });
        next(err);
    }
}
// GET /api/orders/:orderId/documents
async function getOrderDocuments(req, res, next) {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: "Unauthorized" });
        const { orderId } = req.params;
        if (!orderId) {
            return res
                .status(400)
                .json({ success: false, message: "orderId required" });
        }
        const { prisma } = await Promise.resolve().then(() => __importStar(require("../utils/prisma")));
        const documents = await prisma.document.findMany({
            where: { orderId },
            orderBy: { createdAt: "desc" },
        });
        return res.json({ success: true, documents });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=order.controller.js.map