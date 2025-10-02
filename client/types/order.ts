// types/bank.ts

export type OrderStatus =
  | "AWAITING_PAYMENT" // Buyer needs to pay
  | "BANK_REVIEW" // Banks reviewing / approval
  | "IN_TRANSIT" // Order shipped
  | "DELIVERED" // Delivered but not yet completed
  | "DISPUTED" // Order in dispute
  | "CANCELLED"; // Order cancelled

export type UserType = "PRODUCER" | "BUYER" | "ADMIN" | "USER";

export interface User {
  id: string;
  fullName: string;
  email: string;
  userType: UserType;
}

export interface OrderItem {
  product: {
    id: string;
    name: string;
    category: string;
  };
  quantity: number;
  lineTotal: number;
}

export interface Document {
  id: string;
  filename: string;
  documentType?: string;
  status: "PENDING" | "VALIDATED" | "REJECTED";
}

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
}
