import { prisma } from "../utils/prisma";
import { Decimal } from "@prisma/client/runtime";
import {
  approveBuyerBank,
  approveSellerBank,
  releaseFirstPayment,
} from "./escrow-deploy.service";

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
  return prisma.document.update({
    where: { id: documentId },
    data: {
      status: statusMap[data.status],
      validatedBy: data.validatedBy,
      validatedAt: new Date(),
      rejectionReason: data.rejectionReason,
      updatedAt: new Date(),
    },
  });
}

/** ---------- BANK REVIEWS & ESCROW ---------- */

/** Request documents from bank */
export async function requestDocumentsFromBank(
  orderId: string,
  bankId: string,
  comments: string
) {
  return prisma.bankReview.create({
    data: { orderId, bankId, action: "request_docs", comments },
  });
}

/** Approve order by bank and handle partial escrow release */
export async function approveOrderByBankService(
  orderId: string,
  bankId: string,
  bankType: "buyer" | "seller",
  comments?: string
) {
  return prisma.$transaction(async (tx: any) => {
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
    await tx.bankReview.create({
      data: { orderId, bankId, action: "approve", comments },
    });

    // Prepare updates
    const updates: Partial<typeof order> = { updatedAt: new Date() };
    if (bankType === "buyer") updates.buyerBankApproved = true;
    if (bankType === "seller") updates.sellerBankApproved = true;

    // Call smart contract to approve on blockchain
    if (order.escrowAddress) {
      console.log(
        `Calling blockchain ${bankType} bank approval for escrow:`,
        order.escrowAddress
      );
      try {
        if (bankType === "buyer") {
          await approveBuyerBank(order.escrowAddress);
          console.log("Buyer bank approved on blockchain");
        } else {
          await approveSellerBank(order.escrowAddress);
          console.log("Seller bank approved on blockchain");
        }
      } catch (err) {
        console.error("Failed to approve on blockchain:", err);
        throw new Error(
          `Failed to approve ${bankType} bank on blockchain: ${err}`
        );
      }
    } else {
      console.warn("No escrow address found - skipping blockchain approval");
    }

    // Determine future approval state
    const willBeBuyerApproved =
      bankType === "buyer" ? true : order.buyerBankApproved;
    const willBeSellerApproved =
      bankType === "seller" ? true : order.sellerBankApproved;

    // If both banks are approved and order is not yet in transit
    if (
      willBeBuyerApproved &&
      willBeSellerApproved &&
      order.status !== "IN_TRANSIT"
    ) {
      updates.status = "IN_TRANSIT";

      // Release first 50% payment on blockchain
      if (order.escrowAddress) {
        console.log(
          "Both banks approved - releasing first payment on blockchain"
        );
        try {
          const txResult = await releaseFirstPayment(order.escrowAddress);
          console.log(
            "First payment released on blockchain:",
            txResult.transactionHash
          );

          // Create payment release record with transaction hash
          await tx.paymentRelease.create({
            data: {
              orderId,
              type: "PARTIAL50",
              amount: order.total.div(2),
              released: true,
              releasedAt: new Date(),
              transactionId: txResult.transactionHash,
            },
          });
        } catch (err) {
          console.error("Failed to release first payment on blockchain:", err);
          throw new Error(`Failed to release first payment: ${err}`);
        }
      } else {
        // No escrow address - just create DB record
        await tx.paymentRelease.create({
          data: {
            orderId,
            type: "PARTIAL50",
            amount: order.total.div(2),
            released: true,
            releasedAt: new Date(),
          },
        });
      }
    }

    // Update order
    return tx.order.update({ where: { id: orderId }, data: updates });
  });
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
