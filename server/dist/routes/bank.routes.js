"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bank_controller_1 = require("../controllers/bank.controller");
const router = (0, express_1.Router)();
/**
 * GET /api/bank/clients
 * Fetch all clients for the bank dashboard
 */
router.get("/clients", bank_controller_1.getClientsController);
/**
 * PUT /api/bank/clients/:id/kyc
 * Update a client's KYC status (approve/reject/request_info)
 */
router.put("/clients/:id/kyc", bank_controller_1.updateClientKycController);
/**
 * GET /api/bank/disputes
 * Fetch all disputes for arbitration
 */
router.get("/disputes", bank_controller_1.getDisputesController);
/**
 * PUT /api/bank/disputes/:id
 * Update dispute status or add ruling
 */
router.put("/disputes/:id", bank_controller_1.updateDisputeController);
/**
 * GET /api/bank/documents
 * Fetch all documents for validation
 */
router.get("/documents", bank_controller_1.getDocumentsController);
/**
 * PUT /api/bank/documents/:id
 * Update document validation status
 */
router.put("/documents/:id", bank_controller_1.updateDocumentController);
/**
 * GET /api/bank/escrows
 * Fetch all escrows for oversight
 */
router.get("/escrows", bank_controller_1.getEscrowsController);
/**
 * PUT /api/bank/escrows/:id
 * Update escrow approval status
 */
router.put("/escrows/:id", bank_controller_1.updateEscrowController);
/**
 * GET /api/bank/orders
 * Fetch all orders for bank review
 */
router.get("/orders", bank_controller_1.getOrdersController);
/**
 * PUT /api/bank/orders/:id/approval
 * Update order bank approval status
 */
router.put("/orders/:id/approval", bank_controller_1.updateOrderApprovalController);
/**
 * POST /api/bank/orders/:id/request-documents
 * Request documents from buyer or seller
 */
router.post("/orders/:id/request-documents", bank_controller_1.requestDocumentsController);
/**
 * GET /api/bank/orders/workflow
 * Fetch all orders with complete workflow status
 */
router.get("/orders/workflow", bank_controller_1.getOrdersWithWorkflowController);
/**
 * PUT /api/bank/orders/:id/shipment
 * Confirm shipment and release 50% payment
 */
router.put("/orders/:id/shipment", bank_controller_1.confirmShipmentController);
/**
 * PUT /api/bank/orders/:id/delivery
 * Confirm delivery and release final 50% payment
 */
router.put("/orders/:id/delivery", bank_controller_1.confirmDeliveryController);
router.get("/banks", bank_controller_1.getBanksController);
exports.default = router;
//# sourceMappingURL=bank.routes.js.map