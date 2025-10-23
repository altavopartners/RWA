/////////////////////////
// Order Status Types
/////////////////////////

export type OrderStatus =
  | "BANK_REVIEW" // Banks reviewing / approval
  | "IN_TRANSIT" // Order shipped
  | "DELIVERED" // Delivered but not yet completed
  | "DISPUTED" // Order in dispute
  | "CANCELLED" // Order cancelled
  // Extended statuses used by PaymentReleasePanel/UI workflow
  | "banks_approved"
  | "shipped_50_released"
  | "received_100_released"
  | "completed";

export type DocumentStatus = "PENDING" | "VALIDATED" | "REJECTED";

export type UserType = "PRODUCER" | "BUYER" | "ADMIN" | "USER";

/////////////////////////
// User / Client
/////////////////////////

export interface User {
  id: string;
  fullName: string;
  email: string;
  userType: UserType;
  accountId?: string; // Hedera account ID
  walletAddress?: string;
}

/////////////////////////
// Order Items
/////////////////////////

export interface OrderItem {
  product: {
    id?: string;
    name: string;
    category: string;
  };
  quantity: number;
  lineTotal: number;
}

/////////////////////////
// Documents
/////////////////////////

export interface Document {
  id: string;
  filename: string;
  documentType?: string;
  status: DocumentStatus;
}

export interface BankDocument {
  id: string;
  filename: string;
  cid: string;
  url: string;
  category?: string;
  documentType?: string;
  status: "PENDING" | "VALIDATED" | "REJECTED";
  user: {
    id: string;
    fullName: string;
    email: string;
    userType: string;
  };
  order?: {
    id: string;
    code: string;
  };
  createdAt: string;
  validatedBy?: string;
  validatedAt?: string;
  rejectionReason?: string;
}

/////////////////////////
// Bank Orders
/////////////////////////

export interface BankOrder {
  id: string;
  code?: string;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  total: number;
  createdAt: string;
  user: User;
  items: OrderItem[];
  documents: Document[];
  buyerBankApproved: boolean;
  sellerBankApproved: boolean;
  escrowAddress?: string;
  hederaTransactionId?: string;
  shipmentTrackingId?: string;
  buyerBankId?: string;
  sellerBankId?: string;
}
/////////////////////////
// Client (User + optional orders / KYC)
// Matches Prisma User model fields
/////////////////////////

export interface Client extends User {
  kycStatus?: "PENDING" | "VERIFIED" | "REJECTED";
  kycExpiry?: string;
  orders?: BankOrder[];
  // Extended fields (if computed on backend)
  orderCount?: number;
  totalVolume?: number;
  lastActivity?: string;
}

/////////////////////////
// Disputes
/////////////////////////

export interface Dispute {
  id: string;
  orderId: string;
  initiatedBy: "Buyer" | "Producer";
  reason: string;
  status: "Open" | "UnderReview" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High";
  amount: number;
  currency: string;
  createdAt: string;
  producer: { name: string; type: "Producer" };
  buyer: { name: string; type: "Buyer" };
  evidence: {
    id: string;
    submittedBy: "Buyer" | "Producer";
    documentCid: string;
    description: string;
    createdAt: string;
    fileName: string;
  }[];
  rulings: {
    id: string;
    ruling: string;
    reviewedBy: string;
    reviewedAt: string;
    [key: string]: unknown;
  }[];
}

/////////////////////////
// Escrows (BankOrder + payment releases)
/////////////////////////

export interface Escrow extends BankOrder {
  paymentReleases: {
    id: string;
    type: string;
    amount: number;
    released: boolean;
    releasedAt?: string;
  }[];
}
