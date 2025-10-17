import { Router } from "express";
import {
  getClientsController,
  getDisputesController,
  updateDisputeController,
  getDocumentsController,
  updateDocumentController,
  getEscrowsController,
  updateEscrowController,
  getOrdersController,
  updateOrderApprovalController,
  confirmShipmentController,
  confirmDeliveryController,
  getOrdersWithWorkflowController,
  getBanksController,
} from "../controllers/bank.controller";

const router = Router();

/**
 * GET /api/bank/clients
 * Fetch all clients for the bank dashboard
 */
router.get("/clients", getClientsController);


/**
 * GET /api/bank/disputes
 * Fetch all disputes for arbitration
 */
router.get("/disputes", getDisputesController);

/**
 * PUT /api/bank/disputes/:id
 * Update dispute status or add ruling
 */
router.put("/disputes/:id", updateDisputeController);

/**
 * GET /api/bank/documents
 * Fetch all documents for validation
 */
router.get("/documents", getDocumentsController);

/**
 * PUT /api/bank/documents/:id
 * Update document validation status
 */
router.put("/documents/:id", updateDocumentController);

/**
 * GET /api/bank/escrows
 * Fetch all escrows for oversight
 */
router.get("/escrows", getEscrowsController);

/**
 * PUT /api/bank/escrows/:id
 * Update escrow approval status
 */
router.put("/escrows/:id", updateEscrowController);

/**
 * GET /api/bank/orders
 * Fetch all orders for bank review
 */
router.get("/orders", getOrdersController);

/**
 * PUT /api/bank/orders/:id/approval
 * Update order bank approval status
 */
router.put("/orders/:id/approval", updateOrderApprovalController);

/**
 * GET /api/bank/orders/workflow
 * Fetch all orders with complete workflow status
 */
router.get("/orders/workflow", getOrdersWithWorkflowController);

/**
 * PUT /api/bank/orders/:id/shipment
 * Confirm shipment and release 50% payment
 */
router.put("/orders/:id/shipment", confirmShipmentController);

/**
 * PUT /api/bank/orders/:id/delivery
 * Confirm delivery and release final 50% payment
 */
router.put("/orders/:id/delivery", confirmDeliveryController);

router.get("/banks", getBanksController);

export default router;
