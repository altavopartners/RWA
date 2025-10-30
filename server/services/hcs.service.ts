// services/hcs.service.ts
import { TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import { getHederaClient } from "../config/hedera";
import debug from "../utils/debug";

// HCS Topic ID for order events
const HCS_TOPIC_ID = process.env.HEDERA_HCS_TOPIC_ID || "0.0.28659765";

export interface OrderEvent {
  eventType: string;
  orderId: string;
  orderCode: string;
  timestamp: string;
  details: Record<string, unknown>;
}

/**
 * Submit an order event to Hedera Consensus Service
 * Creates an immutable audit trail for regulatory compliance
 */
export async function submitOrderEventToHCS(
  event: OrderEvent
): Promise<string> {
  try {
    const client = getHederaClient();

    const eventMessage = JSON.stringify({
      version: "1.0",
      network: process.env.HEDERA_NETWORK || "testnet",
      ...event,
    });

    debug.info(
      `[HCS] Submitting event: ${event.eventType} for order ${event.orderCode}`
    );

    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(HCS_TOPIC_ID)
      .setMessage(eventMessage);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    debug.info(`[HCS] Event submitted successfully. Status: ${receipt.status}`);
    debug.info(`[HCS] Transaction ID: ${txResponse.transactionId}`);

    return txResponse.transactionId.toString();
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.warn(`[HCS] ⚠️  Warning: HCS event not submitted: ${errorMsg}`);
    debug.info(
      `[HCS] Warning - Event may not be logged (non-blocking): ${errorMsg}`
    );
    // Don't throw - HCS is non-critical, only log warning
    return "";
  }
}

/**
 * Log order creation event
 */
export async function logOrderCreated(
  orderId: string,
  orderCode: string,
  buyerId: string,
  producerId: string,
  totalAmount: number
): Promise<void> {
  try {
    await submitOrderEventToHCS({
      eventType: "ORDER_CREATED",
      orderId,
      orderCode,
      timestamp: new Date().toISOString(),
      details: {
        buyerId,
        producerId,
        totalAmount,
        status: "AWAITING_PAYMENT",
      },
    });
  } catch (error) {
    debug.info(`[HCS] Failed to log order creation: ${error}`);
    // Non-critical - continue without blocking
  }
}

/**
 * Log order payment received
 */
export async function logOrderPaymentReceived(
  orderId: string,
  orderCode: string,
  amount: number,
  transactionId: string
): Promise<void> {
  try {
    await submitOrderEventToHCS({
      eventType: "PAYMENT_RECEIVED",
      orderId,
      orderCode,
      timestamp: new Date().toISOString(),
      details: {
        amount,
        transactionId,
        status: "BANK_REVIEW",
      },
    });
  } catch (error) {
    debug.info(`[HCS] Failed to log payment: ${error}`);
  }
}

/**
 * Log document validation event
 */
export async function logDocumentValidated(
  orderId: string,
  orderCode: string,
  documentId: string,
  status: "VALIDATED" | "REJECTED",
  validatedBy: string,
  rejectionReason?: string
): Promise<void> {
  try {
    await submitOrderEventToHCS({
      eventType: "DOCUMENT_VALIDATED",
      orderId,
      orderCode,
      timestamp: new Date().toISOString(),
      details: {
        documentId,
        status,
        validatedBy,
        rejectionReason: rejectionReason || null,
      },
    });
  } catch (error) {
    debug.info(`[HCS] Failed to log document validation: ${error}`);
  }
}

/**
 * Log order shipment
 */
export async function logOrderShipment(
  orderId: string,
  orderCode: string,
  trackingId: string,
  carrier: string
): Promise<void> {
  try {
    await submitOrderEventToHCS({
      eventType: "ORDER_SHIPPED",
      orderId,
      orderCode,
      timestamp: new Date().toISOString(),
      details: {
        trackingId,
        carrier,
        status: "IN_TRANSIT",
      },
    });
  } catch (error) {
    debug.info(`[HCS] Failed to log shipment: ${error}`);
  }
}

/**
 * Log order delivery
 */
export async function logOrderDelivered(
  orderId: string,
  orderCode: string,
  deliveryDate: string
): Promise<void> {
  try {
    await submitOrderEventToHCS({
      eventType: "ORDER_DELIVERED",
      orderId,
      orderCode,
      timestamp: new Date().toISOString(),
      details: {
        deliveryDate,
        status: "DELIVERED",
      },
    });
  } catch (error) {
    debug.info(`[HCS] Failed to log delivery: ${error}`);
  }
}

/**
 * Log payment release
 */
export async function logPaymentReleased(
  orderId: string,
  orderCode: string,
  releaseType: "FIFTY_PERCENT" | "HUNDRED_PERCENT",
  amount: number,
  releaseDate: string
): Promise<void> {
  try {
    await submitOrderEventToHCS({
      eventType: "PAYMENT_RELEASED",
      orderId,
      orderCode,
      timestamp: new Date().toISOString(),
      details: {
        releaseType,
        amount,
        releaseDate,
        status:
          releaseType === "FIFTY_PERCENT"
            ? "shipped_50_released"
            : "received_100_released",
      },
    });
  } catch (error) {
    debug.info(`[HCS] Failed to log payment release: ${error}`);
  }
}

/**
 * Log dispute creation
 */
export async function logDisputeCreated(
  orderId: string,
  orderCode: string,
  disputeId: string,
  reason: string,
  priority: string,
  initiatedBy: string
): Promise<void> {
  try {
    await submitOrderEventToHCS({
      eventType: "DISPUTE_CREATED",
      orderId,
      orderCode,
      timestamp: new Date().toISOString(),
      details: {
        disputeId,
        reason,
        priority,
        initiatedBy,
        status: "DISPUTED",
      },
    });
  } catch (error) {
    debug.info(`[HCS] Failed to log dispute: ${error}`);
  }
}

/**
 * Log dispute resolution
 */
export async function logDisputeResolved(
  orderId: string,
  orderCode: string,
  disputeId: string,
  ruling: string,
  resolvedBy: string
): Promise<void> {
  try {
    await submitOrderEventToHCS({
      eventType: "DISPUTE_RESOLVED",
      orderId,
      orderCode,
      timestamp: new Date().toISOString(),
      details: {
        disputeId,
        ruling,
        resolvedBy,
        status: "RESOLVED",
      },
    });
  } catch (error) {
    debug.info(`[HCS] Failed to log dispute resolution: ${error}`);
  }
}

/**
 * Log order completion
 */
export async function logOrderCompleted(
  orderId: string,
  orderCode: string
): Promise<void> {
  try {
    await submitOrderEventToHCS({
      eventType: "ORDER_COMPLETED",
      orderId,
      orderCode,
      timestamp: new Date().toISOString(),
      details: {
        status: "completed",
      },
    });
  } catch (error) {
    debug.info(`[HCS] Failed to log order completion: ${error}`);
  }
}

/**
 * Log escrow deployment
 */
export async function logEscrowDeployed(
  orderId: string,
  orderCode: string,
  escrowAddress: string,
  hederaTxId: string
): Promise<void> {
  try {
    await submitOrderEventToHCS({
      eventType: "ESCROW_DEPLOYED",
      orderId,
      orderCode,
      timestamp: new Date().toISOString(),
      details: {
        escrowAddress,
        hederaTxId,
        status: "ESCROW_ACTIVE",
      },
    });
  } catch (error) {
    debug.info(`[HCS] Failed to log escrow deployment: ${error}`);
  }
}

/**
 * Log KYC verification
 */
export async function logKYCVerified(
  userId: string,
  userEmail: string,
  kycStatus: string,
  verifiedBy: string
): Promise<void> {
  try {
    await submitOrderEventToHCS({
      eventType: "KYC_VERIFIED",
      orderId: userId,
      orderCode: userEmail,
      timestamp: new Date().toISOString(),
      details: {
        userId,
        userEmail,
        kycStatus,
        verifiedBy,
      },
    });
  } catch (error) {
    debug.info(`[HCS] Failed to log KYC verification: ${error}`);
  }
}
