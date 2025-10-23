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
    payload: {
      action: string;
      ruling?: string | Record<string, unknown>;
      reviewedBy: string;
    }
  ): Promise<Dispute> => {
    console.log("API: Updating dispute", disputeId, payload);
    console.log("API: Backend URL:", BACKEND_URL);

    const res = await fetch(`${BACKEND_URL}/api/bank/disputes/${disputeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("API: Response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("API: Error response:", errorText);
      throw new Error(`Failed to update dispute (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    console.log("API: Success response:", data);
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

  /** Bank approval (triggers 50% release when both banks approved) */
  updateEscrow: async (
    orderId: string,
    payload: { bankId: string; bankType: "buyer" | "seller"; comments?: string }
  ): Promise<BankOrder> => {
    const res = await fetch(`${BACKEND_URL}/api/bank/escrows/${orderId}`, {
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

  /** Request documents from buyer or seller */
  requestDocuments: async (
    orderId: string,
    payload: {
      bankId: string;
      requestTo: "buyer" | "seller";
      comments?: string;
    }
  ): Promise<any> => {
    const res = await fetch(
      `${BACKEND_URL}/api/bank/orders/${orderId}/request-documents`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) throw new Error("Failed to request documents");
    const data = await res.json();
    return data.data;
  },
};

/** Document API (IPFS-backed storage) */
export const documentApi = {
  /** Upload a document with metadata */
  upload: async (
    file: File,
    metadata: {
      categoryKey?: string;
      typeKey?: string;
      orderId?: string;
    },
    token?: string
  ): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    if (metadata.categoryKey)
      formData.append("categoryKey", metadata.categoryKey);
    if (metadata.typeKey) formData.append("typeKey", metadata.typeKey);
    if (metadata.orderId) formData.append("orderId", metadata.orderId);

    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BACKEND_URL}/api/documents/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Upload failed");
    }

    return await res.json();
  },

  /** Download a document by CID */
  download: async (cid: string): Promise<Blob> => {
    const res = await fetch(`${BACKEND_URL}/api/documents/${cid}/download`);
    if (!res.ok) throw new Error("Download failed");
    return await res.blob();
  },

  /** Get document URL by CID */
  getUrl: (cid: string): string => {
    return `${BACKEND_URL}/api/documents/${cid}/download`;
  },
};
