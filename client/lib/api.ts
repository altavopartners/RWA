// lib/api.ts
import type {
  Client,
  Dispute,
  Document,
  Escrow,
  BankOrder,
} from "../types/bank";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

export const bankApi = {
  /** Fetch all clients */
  getClients: async (): Promise<Client[]> => {
    const res = await fetch(`${BACKEND_URL}/api/bank/clients`);
    if (!res.ok) throw new Error("Failed to fetch clients");
    const data = await res.json();
    return data.data;
  },

  /** Update KYC status for a client */
  updateClientKyc: async (
    clientId: string,
    payload: { action: string; reason?: string; reviewedBy: string }
  ): Promise<Client> => {
    const res = await fetch(`${BACKEND_URL}/api/bank/clients/${clientId}/kyc`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update KYC");
    const data = await res.json();
    return data.data;
  },

  /** Fetch all disputes */
  getDisputes: async (): Promise<Dispute[]> => {
    const res = await fetch(`${BACKEND_URL}/api/bank/disputes`);
    if (!res.ok) throw new Error("Failed to fetch disputes");
    const data = await res.json();
    return data.data;
  },

  /** Update dispute status or add ruling */
  updateDispute: async (
    disputeId: string,
    payload: { action: string; ruling?: any; reviewedBy: string }
  ): Promise<Dispute> => {
    const res = await fetch(`${BACKEND_URL}/api/bank/disputes/${disputeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update dispute");
    const data = await res.json();
    return data.data;
  },

  /** Fetch all documents */
  getDocuments: async (): Promise<Document[]> => {
    const res = await fetch(`${BACKEND_URL}/api/bank/documents`);
    if (!res.ok) throw new Error("Failed to fetch documents");
    const data = await res.json();
    return data.data;
  },

  /** Update document validation status */
  updateDocument: async (
    documentId: string,
    payload: { status: string; validatedBy: string; rejectionReason?: string }
  ): Promise<Document> => {
    const res = await fetch(`${BACKEND_URL}/api/bank/documents/${documentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update document");
    const data = await res.json();
    return data.data;
  },

  /** Fetch all escrows */
  getEscrows: async (): Promise<Escrow[]> => {
    const res = await fetch(`${BACKEND_URL}/api/bank/escrows`);
    if (!res.ok) throw new Error("Failed to fetch escrows");
    const data = await res.json();
    return data.data;
  },

  /** Update escrow approval status */
  updateEscrow: async (
    escrowId: string,
    payload: { action: string; approvedBy: string; notes?: string }
  ): Promise<Escrow> => {
    const res = await fetch(`${BACKEND_URL}/api/bank/escrows/${escrowId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to update escrow");
    const data = await res.json();
    return data.data;
  },

  /** Fetch all orders */
  getOrders: async (): Promise<BankOrder[]> => {
    const res = await fetch(`${BACKEND_URL}/api/bank/orders`);
    if (!res.ok) throw new Error("Failed to fetch orders");
    const data = await res.json();
    return data.data;
  },

  /** Update order bank approval status - Enhanced with dual-bank workflow */
  updateOrderApproval: async (
    orderId: string,
    payload: {
      action: string;
      approvedBy: string;
      notes?: string;
      bankType?: "buyer" | "seller";
    }
  ): Promise<BankOrder> => {
    const res = await fetch(
      `${BACKEND_URL}/api/bank/orders/${orderId}/approval`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) throw new Error("Failed to update order approval");
    const data = await res.json();
    return data.data;
  },

  /** Fetch orders with complete workflow status */
  getOrdersWithWorkflow: async (): Promise<BankOrder[]> => {
    const res = await fetch(`${BACKEND_URL}/api/bank/orders/workflow`);
    if (!res.ok) throw new Error("Failed to fetch orders with workflow");
    const data = await res.json();
    return data.data;
  },

  /** Confirm shipment and release 50% payment */
  confirmShipment: async (
    orderId: string,
    payload: { trackingId: string; confirmedBy: string; notes?: string }
  ): Promise<BankOrder> => {
    const res = await fetch(
      `${BACKEND_URL}/api/bank/orders/${orderId}/shipment`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) throw new Error("Failed to confirm shipment");
    const data = await res.json();
    return data.data;
  },

  /** Confirm delivery and release final 50% payment */
  confirmDelivery: async (
    orderId: string,
    payload: { confirmedBy: string; notes?: string }
  ): Promise<BankOrder> => {
    const res = await fetch(
      `${BACKEND_URL}/api/bank/orders/${orderId}/delivery`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) throw new Error("Failed to confirm delivery");
    const data = await res.json();
    return data.data;
  },
};
