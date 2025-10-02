import { Request, Response } from "express";
import * as clientService from "../services/bank.service";

/**
 * GET /api/clients
 */
export const getClientsController = async (_req: Request, res: Response) => {
  try {
    const clients = await clientService.getClients();

    // Map data to a cleaner response for frontend
    const response = clients.map((c) => ({
      id: c.id,
      name: c.fullName || c.businessName,
      email: c.email,
      hederaId: c.accountId,
      type: c.userType === "PRODUCER" ? "Producer" : "Buyer",
      kycStatus: c.kycStatus.charAt(0) + c.kycStatus.slice(1).toLowerCase(), // e.g., "Pending"
      kycExpiry: c.kycExpiry,
      orderCount: c.orders.length,
      totalVolume: c.orders.reduce((sum, o) => sum + Number(o.total), 0),
      lastActivity: c.updatedAt,
    }));

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
};

/**
 * POST /api/clients/:id/kyc
 */
export const updateClientKycController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { action, reason, reviewedBy } = req.body;

    const updatedClient = await clientService.updateClientKyc(id, {
      action,
      reason,
      reviewedBy,
    });

    res.status(200).json({
      id: updatedClient.id,
      kycStatus: updatedClient.kycStatus,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update KYC" });
  }
};
