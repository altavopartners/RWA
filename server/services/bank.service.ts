import { prisma } from "../utils/prisma";
import { Decimal } from "@prisma/client/runtime";
import {
  releaseFirstPayment,
  approveBuyerBank,
  approveSellerBank,
} from "./escrow-deploy.service";
import {
  logDocumentValidated,
  logDisputeCreated,
  logDisputeResolved,
  logPaymentReleased,
} from "./hcs.service";
import debug from "../utils/debug";

/** ---------- CLIENT / KYC ---------- */

/** Fetch all clients (with orders and KYC info) */
export async function getClients() {
  return prisma.user.findMany({
    where: { userType: { in: ["PRODUCER", "BUYER"] } },
    include: { orders: true },
    orderBy: { updatedAt: "desc" },
  });
}

/** Update client KYC status */
export async function updateClientKyc(
  clientId: string,
  data: { action: string; reason?: string; reviewedBy: string }
) {
  let kycStatus: "PENDING" | "VERIFIED" | "REJECTED" = "PENDING";
  if (data.action === "approve") kycStatus = "VERIFIED";
  else if (data.action === "reject") kycStatus = "REJECTED";

  return prisma.user.update({
    where: { id: clientId },
    data: {
      kycStatus,
      updatedAt: new Date(),
      kycReviews: {
        create: {
          action: data.action,
          reason: data.reason,
          reviewer: data.reviewedBy,
        },
      },
    },
  });
}

/** ---------- DISPUTES ---------- */

/** Fetch all disputes with related order and user data */
export async function getDisputes() {
  const orders = await prisma.order.findMany({
    where: { status: "DISPUTED" },
    include: {
      user: {
        select: { id: true, fullName: true, email: true, userType: true },
      },
      items: {
        include: {
          product: { select: { name: true, producerWalletId: true } },
        },
      },
      documents: {
        select: {
          id: true,
          filename: true,
          cid: true,
          category: true,
          createdAt: true,
          user: { select: { fullName: true, userType: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map((order: any) => ({
    id: order.id,
    orderId: order.code || order.id,
    initiatedBy: "Buyer",
    reason: "Trade dispute",
    status: "Open",
    priority: "Medium",
    amount: Number(order.total),
    currency: "HBAR",
    createdAt: order.createdAt.toISOString(),
    producer: { name: "Producer Name", type: "Producer" },
    buyer: { name: order.user.fullName || "Unknown", type: "Buyer" },
    evidence: order.documents.map((doc: any) => ({
      id: doc.id,
      submittedBy: doc.user.userType === "PRODUCER" ? "Producer" : "Buyer",
      documentCid: doc.cid,
      description: `Document: ${doc.filename}`,
      createdAt: doc.createdAt.toISOString(),
      fileName: doc.filename,
    })),
    rulings: [],
  }));
}

/** Update dispute status */
export async function updateDispute(
  disputeId: string,
  data: { action: string; ruling?: any; reviewedBy: string }
) {
  console.log("Service: Updating dispute", disputeId, data);

  let orderStatus = "DISPUTED";
  if (data.action === "resolve") {
    orderStatus = "DELIVERED"; // Mark as delivered when dispute is resolved
    console.log("Service: Resolving dispute, setting status to DELIVERED");
  }

  const updatedOrder = await prisma.order.update({
    where: { id: disputeId },
    data: { status: orderStatus as any, updatedAt: new Date() },
  });

  console.log(
    "Service: Order updated successfully",
    updatedOrder.id,
    updatedOrder.status
  );

  // Log dispute event to HCS
  if (data.action === "open") {
    // Log dispute creation
    await logDisputeCreated(
      updatedOrder.id,
      updatedOrder.code || "",
      disputeId,
      data.ruling?.reason || "No reason provided",
      data.ruling?.priority || "Medium",
      data.reviewedBy
    );
  } else if (data.action === "resolve") {
    // Log dispute resolution
    await logDisputeResolved(
      updatedOrder.id,
      updatedOrder.code || "",
      disputeId,
      typeof data.ruling === "string"
        ? data.ruling
        : JSON.stringify(data.ruling),
      data.reviewedBy
    );
  }

  return updatedOrder;
}

/** ---------- DOCUMENTS ---------- */

/** Fetch all documents */
export async function getDocuments() {
  return prisma.document.findMany({
    include: {
      user: {
        select: { id: true, fullName: true, email: true, userType: true },
      },
      order: { select: { id: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Submit document */
export async function submitDocument(
  userId: string,
  orderId: string | null,
  filename: string,
  cid: string,
  url: string,
  type?: string
) {
  return prisma.document.create({
    data: {
      userId,
      orderId,
      filename,
      cid,
      url,
      documentType: type as any,
      status: "PENDING",
    },
  });
}

/** Update document status */
export async function updateDocument(
  documentId: string,
  data: {
    status: "approve" | "reject";
    validatedBy: string;
    rejectionReason?: string;
  }
) {
  const statusMap: Record<string, any> = {
    approve: "VALIDATED",
    reject: "REJECTED",
  };
  const updatedDoc = await prisma.document.update({
    where: { id: documentId },
    data: {
      status: statusMap[data.status],
      validatedBy: data.validatedBy,
      validatedAt: new Date(),
      rejectionReason: data.rejectionReason,
      updatedAt: new Date(),
    },
    include: { order: true },
  });

  // Log document validation to HCS
  if (updatedDoc.order) {
    await logDocumentValidated(
      updatedDoc.orderId || "",
      updatedDoc.order.code || "",
      documentId,
      statusMap[data.status] as "VALIDATED" | "REJECTED",
      data.validatedBy,
      data.rejectionReason
    );
  }

  return updatedDoc;
}

/** ---------- BANK REVIEWS & ESCROW ---------- */

/** Request documents from bank */
export async function requestDocumentsFromBank(
  orderId: string,
  bankId: string | null,
  comments: string
) {
  const data: any = {
    orderId,
    action: "request_docs",
    comments,
  };
  if (bankId) data.bankId = bankId;

  return prisma.bankReview.create({ data });
}

/** Approve order by bank and handle partial escrow release */
export async function approveOrderByBankService(
  orderId: string,
  bankId: string | null,
  bankType: "buyer" | "seller",
  comments?: string
) {
  // First, do the fast DB operations in a transaction
  const updatedOrder = await prisma.$transaction(async (tx: any) => {
    // Fetch order first
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");

    // Check if this bank already approved
    if (
      (bankType === "buyer" && order.buyerBankApproved) ||
      (bankType === "seller" && order.sellerBankApproved)
    ) {
      throw new Error(`${bankType} bank has already approved this order`);
    }

    // Record bank review
    const reviewData: any = {
      orderId,
      action: "approve",
      comments,
    };
    if (bankId) reviewData.bankId = bankId;

    await tx.bankReview.create({ data: reviewData });

    // Prepare updates
    const updates: Partial<typeof order> = { updatedAt: new Date() };
    if (bankType === "buyer") updates.buyerBankApproved = true;
    if (bankType === "seller") updates.sellerBankApproved = true;

    // Determine future approval state
    const willBeBuyerApproved =
      bankType === "buyer" ? true : order.buyerBankApproved;
    const willBeSellerApproved =
      bankType === "seller" ? true : order.sellerBankApproved;

    debug.service(
      "BankService",
      `Bank approval recorded for ${bankType} on order ${orderId}`
    );

    // If both banks are approved and order is not yet in transit
    if (
      willBeBuyerApproved &&
      willBeSellerApproved &&
      order.status !== "IN_TRANSIT"
    ) {
      updates.status = "IN_TRANSIT";
    }

    // Update order
    return tx.order.update({ where: { id: orderId }, data: updates });
  });

  // Now handle long-running blockchain operations OUTSIDE the transaction
  if (updatedOrder.status === "IN_TRANSIT" && updatedOrder.escrowAddress) {
    debug.transaction("Both banks approved - attempting 50% release");
    try {
      // Try to call approvals first (for new contracts that support arbiter approval)
      let approvalsSucceeded = false;
      try {
        debug.transaction("Calling approveByBuyer...");
        await approveBuyerBank(updatedOrder.escrowAddress);
        debug.transaction("✅ Buyer approval succeeded");
        approvalsSucceeded = true;
      } catch (approvalErr: any) {
        debug.info("Buyer approval not supported (likely old contract)");
      }

      try {
        debug.transaction("Calling approveBySeller...");
        await approveSellerBank(updatedOrder.escrowAddress);
        debug.transaction("✅ Seller approval succeeded");
        approvalsSucceeded = true;
      } catch (approvalErr: any) {
        debug.info("Seller approval not supported (likely old contract)");
      }

      // Now try to release first 50% payment
      debug.transaction("Calling confirmShipment to release 50% payment...");
      const txResult = await releaseFirstPayment(updatedOrder.escrowAddress);
      debug.transaction(
        "✅ First payment released - tx:",
        txResult.transactionHash
      );

      // Create payment release record AFTER blockchain call
      await prisma.paymentRelease.create({
        data: {
          orderId,
          type: "PARTIAL50",
          amount: updatedOrder.total.div(2),
          released: true,
          releasedAt: new Date(),
          transactionId: txResult.transactionHash,
        },
      });
      debug.service("BankService", "Payment release recorded in database");

      // Log payment release to HCS
      await logPaymentReleased(
        orderId,
        updatedOrder.code || "",
        "FIFTY_PERCENT",
        parseFloat(updatedOrder.total.div(2).toString()),
        new Date().toISOString()
      );
    } catch (err: any) {
      debug.error("Failed to release payment on blockchain", err.message);
      // Log but don't throw - payment release attempt failed but order is marked IN_TRANSIT
      // This allows manual retry or investigation
    }
  } else if (
    updatedOrder.status === "IN_TRANSIT" &&
    !updatedOrder.escrowAddress
  ) {
    // No escrow address - just create DB record
    await prisma.paymentRelease.create({
      data: {
        orderId,
        type: "PARTIAL50",
        amount: updatedOrder.total.div(2),
        released: true,
        releasedAt: new Date(),
      },
    });

    // Log payment release to HCS
    await logPaymentReleased(
      orderId,
      updatedOrder.code || "",
      "FIFTY_PERCENT",
      parseFloat(updatedOrder.total.div(2).toString()),
      new Date().toISOString()
    );
  }

  return updatedOrder;
}

/** ---------- ORDERS ---------- */

/** Fetch all orders */
export async function getOrders() {
  return prisma.order.findMany({
    include: {
      user: true,
      items: { include: { product: true } },
      documents: true,
      paymentReleases: true,
      buyerBank: { select: { id: true, name: true } },
      sellerBank: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Update order approval (buyer/seller bank) */
export async function updateOrderApproval(
  orderId: string,
  data: {
    action: "approve_buyer" | "approve_seller" | "reject";
    approvedBy: string;
    bankType?: "buyer" | "seller";
    notes?: string;
  }
) {
  return prisma.$transaction(async (tx: any) => {
    const updates: any = { updatedAt: new Date() };

    if (data.action === "approve_buyer" && data.bankType === "buyer")
      updates.buyerBankApproved = true;
    if (data.action === "approve_seller" && data.bankType === "seller")
      updates.sellerBankApproved = true;
    if (data.action === "reject") updates.status = "CANCELLED";

    return tx.order.update({ where: { id: orderId }, data: updates });
  });
}

/** ---------- SHIPMENT & DELIVERY ---------- */

/** Confirm shipment */
export async function confirmShipment(
  orderId: string,
  trackingId: string,
  notes?: string
) {
  return prisma.order.update({
    where: { id: orderId },
    data: { shipmentTrackingId: trackingId, updatedAt: new Date() },
  });
}

/** Confirm delivery and release remaining 50% payment */
export async function confirmDelivery(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  const remaining = order.total.div(2);
  await prisma.paymentRelease.create({
    data: {
      orderId,
      type: "FULL100",
      amount: remaining,
      released: true,
      releasedAt: new Date(),
    },
  });

  return prisma.order.update({
    where: { id: orderId },
    data: { status: "DELIVERED", updatedAt: new Date() },
  });
}

/** Get orders with workflow info */
// ---------- ORDERS ----------
export async function getOrdersWithWorkflow() {
  const orders = await prisma.order.findMany({
    include: {
      user: true,
      items: { include: { product: true } },
      documents: true,
      paymentReleases: true,
      buyerBank: { select: { id: true, name: true } }, // <- include bank
      sellerBank: { select: { id: true, name: true } }, // <- include bank
    },
    orderBy: { createdAt: "desc" },
  });

  // Format so frontend has buyerBankId / sellerBankId
  const formattedOrders = orders.map((o: any) => ({
    ...o,
    buyerBankId: o.buyerBank?.id,
    sellerBankId: o.sellerBank?.id,
  }));

  return formattedOrders;
}
/** GET /api/bank/banks */
export async function getBanks() {
  return prisma.bank.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
