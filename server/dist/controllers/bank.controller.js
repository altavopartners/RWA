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
exports.getClientsController = getClientsController;
exports.updateClientKycController = updateClientKycController;
exports.getDisputesController = getDisputesController;
exports.updateDisputeController = updateDisputeController;
exports.getDocumentsController = getDocumentsController;
exports.updateDocumentController = updateDocumentController;
exports.getEscrowsController = getEscrowsController;
exports.updateEscrowController = updateEscrowController;
exports.requestDocumentsController = requestDocumentsController;
exports.getOrdersController = getOrdersController;
exports.updateOrderApprovalController = updateOrderApprovalController;
exports.confirmShipmentController = confirmShipmentController;
exports.confirmDeliveryController = confirmDeliveryController;
exports.getOrdersWithWorkflowController = getOrdersWithWorkflowController;
exports.getBanksController = getBanksController;
const bank_service_1 = require("../services/bank.service");
/** ---------- CLIENTS ---------- */
/** GET /api/bank/clients */
async function getClientsController(req, res) {
    try {
        const clients = await (0, bank_service_1.getClients)();
        res.json({ success: true, data: clients });
    }
    catch (err) {
        console.error("Error fetching clients:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}
/** PUT /api/bank/clients/:id/kyc */
async function updateClientKycController(req, res) {
    try {
        const { id } = req.params;
        const { action, reason, reviewedBy } = req.body;
        if (!action || !reviewedBy)
            return res
                .status(400)
                .json({ success: false, message: "Action and reviewer required" });
        const updatedClient = await (0, bank_service_1.updateClientKyc)(id, {
            action,
            reason,
            reviewedBy,
        });
        res.json({ success: true, data: updatedClient });
    }
    catch (err) {
        console.error("Error updating KYC:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}
/** ---------- DISPUTES ---------- */
/** GET /api/bank/disputes */
async function getDisputesController(req, res) {
    try {
        const disputes = await (0, bank_service_1.getDisputes)();
        res.json({ success: true, data: disputes });
    }
    catch (err) {
        console.error("Error fetching disputes:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}
/** PUT /api/bank/disputes/:id */
async function updateDisputeController(req, res) {
    try {
        const { id } = req.params;
        const { action, ruling, reviewedBy } = req.body;
        if (!action || !reviewedBy)
            return res
                .status(400)
                .json({ success: false, message: "Action and reviewer required" });
        const updatedDispute = await (0, bank_service_1.updateDispute)(id, {
            action,
            ruling,
            reviewedBy,
        });
        res.json({ success: true, data: updatedDispute });
    }
    catch (err) {
        console.error("Error updating dispute:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}
/** ---------- DOCUMENTS ---------- */
/** GET /api/bank/documents */
async function getDocumentsController(req, res) {
    try {
        const documents = await (0, bank_service_1.getDocuments)();
        res.json({ success: true, data: documents });
    }
    catch (err) {
        console.error("Error fetching documents:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}
/** PUT /api/bank/documents/:id */
async function updateDocumentController(req, res) {
    try {
        const { id } = req.params;
        const { status, validatedBy, rejectionReason } = req.body;
        if (!status || !validatedBy)
            return res
                .status(400)
                .json({ success: false, message: "Status and validator required" });
        const updatedDocument = await (0, bank_service_1.updateDocument)(id, {
            status,
            validatedBy,
            rejectionReason,
        });
        res.json({ success: true, data: updatedDocument });
    }
    catch (err) {
        console.error("Error updating document:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}
/** ---------- ESCROWS ---------- */
/** GET /api/bank/escrows */
async function getEscrowsController(req, res) {
    try {
        const orders = await (0, bank_service_1.getOrders)();
        const escrows = orders.filter((o) => o.paymentReleases && o.paymentReleases.length > 0);
        res.json({ success: true, data: escrows });
    }
    catch (err) {
        console.error("Error fetching escrows:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}
/** PUT /api/bank/escrows/:id */
async function updateEscrowController(req, res) {
    try {
        const { id } = req.params;
        const { bankId, bankType, comments } = req.body;
        if (!bankId || !bankType)
            return res
                .status(400)
                .json({ success: false, message: "Bank ID and type required" });
        const updatedOrder = await (0, bank_service_1.approveOrderByBankService)(id, bankId, bankType, comments);
        res.json({ success: true, data: updatedOrder });
    }
    catch (err) {
        console.error("Error updating escrow:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}
/** POST /api/bank/orders/:id/request-documents */
async function requestDocumentsController(req, res) {
    try {
        const { id } = req.params;
        const { bankId, comments, requestTo } = req.body;
        if (!bankId || !requestTo)
            return res
                .status(400)
                .json({
                success: false,
                message: "Bank ID and requestTo (buyer/seller) required",
            });
        const { requestDocumentsFromBank } = await Promise.resolve().then(() => __importStar(require("../services/bank.service")));
        const review = await requestDocumentsFromBank(id, bankId, comments || `Document request to ${requestTo}`);
        res.json({ success: true, data: review });
    }
    catch (err) {
        console.error("Error requesting documents:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}
/** ---------- ORDERS ---------- */
/** GET /api/bank/orders */
async function getOrdersController(req, res) {
    try {
        const orders = await (0, bank_service_1.getOrders)();
        res.json({ success: true, data: orders });
    }
    catch (err) {
        console.error("Error fetching orders:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}
/** PUT /api/bank/orders/:id/approval */
async function updateOrderApprovalController(req, res) {
    try {
        const { id } = req.params;
        const { action, approvedBy, notes, bankType } = req.body;
        if (!action || !approvedBy)
            return res
                .status(400)
                .json({ success: false, message: "Action and approver required" });
        const updatedOrder = await (0, bank_service_1.updateOrderApproval)(id, {
            action,
            approvedBy,
            notes,
            bankType,
        });
        res.json({ success: true, data: updatedOrder });
    }
    catch (err) {
        console.error("Error updating order approval:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}
/** PUT /api/bank/orders/:id/shipment */
async function confirmShipmentController(req, res) {
    try {
        const { id } = req.params;
        const { trackingId, notes } = req.body;
        if (!trackingId)
            return res
                .status(400)
                .json({ success: false, message: "Tracking ID required" });
        const updatedOrder = await (0, bank_service_1.confirmShipment)(id, trackingId, notes);
        res.json({ success: true, data: updatedOrder });
    }
    catch (err) {
        console.error("Error confirming shipment:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}
/** PUT /api/bank/orders/:id/delivery */
async function confirmDeliveryController(req, res) {
    try {
        const { id } = req.params;
        const updatedOrder = await (0, bank_service_1.confirmDelivery)(id);
        res.json({ success: true, data: updatedOrder });
    }
    catch (err) {
        console.error("Error confirming delivery:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}
/** GET /api/bank/orders/workflow */
async function getOrdersWithWorkflowController(req, res) {
    try {
        const orders = await (0, bank_service_1.getOrdersWithWorkflow)();
        res.json({ success: true, data: orders });
    }
    catch (err) {
        console.error("Error fetching orders with workflow:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}
/** GET /api/bank/banks */
async function getBanksController(req, res) {
    try {
        const banks = await (0, bank_service_1.getBanks)();
        res.json({ success: true, data: banks });
    }
    catch (err) {
        console.error("Error fetching banks:", err);
        res.status(500).json({ success: false, message: err.message });
    }
}
//# sourceMappingURL=bank.controller.js.map