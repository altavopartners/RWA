import type { Request, Response } from "express";
import {
  getClients,
  updateClientKyc,
  getDisputes,
  updateDispute,
  getDocuments,
  updateDocument,
  getOrders,
  updateOrderApproval,
  confirmShipment,
  confirmDelivery,
  getOrdersWithWorkflow,
  approveOrderByBankService,
  getBanks,
} from "../services/bank.service";

/** ---------- CLIENTS ---------- */

/** GET /api/bank/clients */
export async function getClientsController(req: Request, res: Response) {
  try {
    const clients = await getClients();
    res.json({ success: true, data: clients });
  } catch (err: any) {
    console.error("Error fetching clients:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/** PUT /api/bank/clients/:id/kyc */
export async function updateClientKycController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { action, reason, reviewedBy } = req.body;

    if (!action || !reviewedBy)
      return res
        .status(400)
        .json({ success: false, message: "Action and reviewer required" });

    const updatedClient = await updateClientKyc(id, {
      action,
      reason,
      reviewedBy,
    });
    res.json({ success: true, data: updatedClient });
  } catch (err: any) {
    console.error("Error updating KYC:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/** ---------- DISPUTES ---------- */

/** GET /api/bank/disputes */
export async function getDisputesController(req: Request, res: Response) {
  try {
    const disputes = await getDisputes();
    res.json({ success: true, data: disputes });
  } catch (err: any) {
    console.error("Error fetching disputes:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/** PUT /api/bank/disputes/:id */
export async function updateDisputeController(req: Request, res: Response) {
  try {
    console.log("Controller: PUT /api/bank/disputes/:id", req.params.id);
    console.log("Controller: Request body:", req.body);

    const { id } = req.params;
    const { action, ruling, reviewedBy } = req.body;

    if (!action || !reviewedBy) {
      console.log("Controller: Missing required fields");
      return res
        .status(400)
        .json({ success: false, message: "Action and reviewer required" });
    }

    const updatedDispute = await updateDispute(id, {
      action,
      ruling,
      reviewedBy,
    });

    console.log("Controller: Dispute updated successfully:", updatedDispute.id);
    res.json({ success: true, data: updatedDispute });
  } catch (err: any) {
    console.error("Controller: Error updating dispute:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/** ---------- DOCUMENTS ---------- */

/** GET /api/bank/documents */
export async function getDocumentsController(req: Request, res: Response) {
  try {
    const documents = await getDocuments();
    res.json({ success: true, data: documents });
  } catch (err: any) {
    console.error("Error fetching documents:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/** PUT /api/bank/documents/:id */
export async function updateDocumentController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, validatedBy, rejectionReason } = req.body;

    if (!status || !validatedBy)
      return res
        .status(400)
        .json({ success: false, message: "Status and validator required" });

    const updatedDocument = await updateDocument(id, {
      status,
      validatedBy,
      rejectionReason,
    });
    res.json({ success: true, data: updatedDocument });
  } catch (err: any) {
    console.error("Error updating document:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/** ---------- ESCROWS ---------- */

/** GET /api/bank/escrows */
export async function getEscrowsController(req: Request, res: Response) {
  try {
    const orders = await getOrders();
    const escrows = orders.filter(
      (o: any) => o.paymentReleases && o.paymentReleases.length > 0
    );
    res.json({ success: true, data: escrows });
  } catch (err: any) {
    console.error("Error fetching escrows:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/** PUT /api/bank/escrows/:id */
export async function updateEscrowController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { bankId, bankType, comments } = req.body;

    if (!bankId || !bankType)
      return res
        .status(400)
        .json({ success: false, message: "Bank ID and type required" });

    const updatedOrder = await approveOrderByBankService(
      id,
      bankId,
      bankType,
      comments
    );
    res.json({ success: true, data: updatedOrder });
  } catch (err: any) {
    console.error("Error updating escrow:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/** POST /api/bank/orders/:id/request-documents */
export async function requestDocumentsController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { bankId, comments, requestTo } = req.body;

    if (!bankId || !requestTo)
      return res.status(400).json({
        success: false,
        message: "Bank ID and requestTo (buyer/seller) required",
      });

    const { requestDocumentsFromBank } = await import(
      "../services/bank.service"
    );
    const review = await requestDocumentsFromBank(
      id,
      bankId,
      comments || `Document request to ${requestTo}`
    );
    res.json({ success: true, data: review });
  } catch (err: any) {
    console.error("Error requesting documents:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/** ---------- ORDERS ---------- */

/** GET /api/bank/orders */
export async function getOrdersController(req: Request, res: Response) {
  try {
    const orders = await getOrders();
    res.json({ success: true, data: orders });
  } catch (err: any) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/** PUT /api/bank/orders/:id/approval */
export async function updateOrderApprovalController(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;
    const { action, approvedBy, notes, bankType } = req.body;

    if (!action || !approvedBy)
      return res
        .status(400)
        .json({ success: false, message: "Action and approver required" });

    const updatedOrder = await updateOrderApproval(id, {
      action,
      approvedBy,
      notes,
      bankType,
    });
    res.json({ success: true, data: updatedOrder });
  } catch (err: any) {
    console.error("Error updating order approval:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/** PUT /api/bank/orders/:id/shipment */
export async function confirmShipmentController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { trackingId, notes } = req.body;

    if (!trackingId)
      return res
        .status(400)
        .json({ success: false, message: "Tracking ID required" });

    const updatedOrder = await confirmShipment(id, trackingId, notes);
    res.json({ success: true, data: updatedOrder });
  } catch (err: any) {
    console.error("Error confirming shipment:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/** PUT /api/bank/orders/:id/delivery */
export async function confirmDeliveryController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updatedOrder = await confirmDelivery(id);
    res.json({ success: true, data: updatedOrder });
  } catch (err: any) {
    console.error("Error confirming delivery:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

/** GET /api/bank/orders/workflow */
export async function getOrdersWithWorkflowController(
  req: Request,
  res: Response
) {
  try {
    const orders = await getOrdersWithWorkflow();
    res.json({ success: true, data: orders });
  } catch (err: any) {
    console.error("Error fetching orders with workflow:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}
/** GET /api/bank/banks */
export async function getBanksController(req: Request, res: Response) {
  try {
    const banks = await getBanks();
    res.json({ success: true, data: banks });
  } catch (err: any) {
    console.error("Error fetching banks:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}
