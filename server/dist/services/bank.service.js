"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClients = getClients;
exports.updateClientKyc = updateClientKyc;
exports.getDisputes = getDisputes;
exports.updateDispute = updateDispute;
exports.getDocuments = getDocuments;
exports.submitDocument = submitDocument;
exports.updateDocument = updateDocument;
exports.requestDocumentsFromBank = requestDocumentsFromBank;
exports.approveOrderByBankService = approveOrderByBankService;
exports.getOrders = getOrders;
exports.updateOrderApproval = updateOrderApproval;
exports.confirmShipment = confirmShipment;
exports.confirmDelivery = confirmDelivery;
exports.getOrdersWithWorkflow = getOrdersWithWorkflow;
exports.getBanks = getBanks;
const prisma_1 = require("../utils/prisma");
const escrow_deploy_service_1 = require("./escrow-deploy.service");
const debug_1 = __importDefault(require("../utils/debug"));
/** ---------- CLIENT / KYC ---------- */
/** Fetch all clients (with orders and KYC info) */
async function getClients() {
    return prisma_1.prisma.user.findMany({
        where: { userType: { in: ["PRODUCER", "BUYER"] } },
        include: { orders: true },
        orderBy: { updatedAt: "desc" },
    });
}
/** Update client KYC status */
async function updateClientKyc(clientId, data) {
    let kycStatus = "PENDING";
    if (data.action === "approve")
        kycStatus = "VERIFIED";
    else if (data.action === "reject")
        kycStatus = "REJECTED";
    return prisma_1.prisma.user.update({
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
async function getDisputes() {
    const orders = await prisma_1.prisma.order.findMany({
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
    return orders.map((order) => ({
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
        evidence: order.documents.map((doc) => ({
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
async function updateDispute(disputeId, data) {
    console.log("Service: Updating dispute", disputeId, data);
    let orderStatus = "DISPUTED";
    if (data.action === "resolve") {
        orderStatus = "DELIVERED"; // Mark as delivered when dispute is resolved
        console.log("Service: Resolving dispute, setting status to DELIVERED");
    }
    const updatedOrder = await prisma_1.prisma.order.update({
        where: { id: disputeId },
        data: { status: orderStatus, updatedAt: new Date() },
    });
    console.log("Service: Order updated successfully", updatedOrder.id, updatedOrder.status);
    return updatedOrder;
}
/** ---------- DOCUMENTS ---------- */
/** Fetch all documents */
async function getDocuments() {
    return prisma_1.prisma.document.findMany({
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
async function submitDocument(userId, orderId, filename, cid, url, type) {
    return prisma_1.prisma.document.create({
        data: {
            userId,
            orderId,
            filename,
            cid,
            url,
            documentType: type,
            status: "PENDING",
        },
    });
}
/** Update document status */
async function updateDocument(documentId, data) {
    const statusMap = {
        approve: "VALIDATED",
        reject: "REJECTED",
    };
    return prisma_1.prisma.document.update({
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
async function requestDocumentsFromBank(orderId, bankId, comments) {
    return prisma_1.prisma.bankReview.create({
        data: { orderId, bankId, action: "request_docs", comments },
    });
}
/** Approve order by bank and handle partial escrow release */
async function approveOrderByBankService(orderId, bankId, bankType, comments) {
    // First, do the fast DB operations in a transaction
    const updatedOrder = await prisma_1.prisma.$transaction(async (tx) => {
        // Fetch order first
        const order = await tx.order.findUnique({ where: { id: orderId } });
        if (!order)
            throw new Error("Order not found");
        // Check if this bank already approved
        if ((bankType === "buyer" && order.buyerBankApproved) ||
            (bankType === "seller" && order.sellerBankApproved)) {
            throw new Error(`${bankType} bank has already approved this order`);
        }
        // Record bank review
        await tx.bankReview.create({
            data: { orderId, bankId, action: "approve", comments },
        });
        // Prepare updates
        const updates = { updatedAt: new Date() };
        if (bankType === "buyer")
            updates.buyerBankApproved = true;
        if (bankType === "seller")
            updates.sellerBankApproved = true;
        // Determine future approval state
        const willBeBuyerApproved = bankType === "buyer" ? true : order.buyerBankApproved;
        const willBeSellerApproved = bankType === "seller" ? true : order.sellerBankApproved;
        debug_1.default.service("BankService", `Bank approval recorded for ${bankType} on order ${orderId}`);
        // If both banks are approved and order is not yet in transit
        if (willBeBuyerApproved &&
            willBeSellerApproved &&
            order.status !== "IN_TRANSIT") {
            updates.status = "IN_TRANSIT";
        }
        // Update order
        return tx.order.update({ where: { id: orderId }, data: updates });
    });
    // Now handle long-running blockchain operations OUTSIDE the transaction
    if (updatedOrder.status === "IN_TRANSIT" && updatedOrder.escrowAddress) {
        debug_1.default.transaction("Both banks approved - attempting 50% release");
        try {
            // Try to call approvals first (for new contracts that support arbiter approval)
            let approvalsSucceeded = false;
            try {
                debug_1.default.transaction("Calling approveByBuyer...");
                await (0, escrow_deploy_service_1.approveBuyerBank)(updatedOrder.escrowAddress);
                debug_1.default.transaction("✅ Buyer approval succeeded");
                approvalsSucceeded = true;
            }
            catch (approvalErr) {
                debug_1.default.info("Buyer approval not supported (likely old contract)");
            }
            try {
                debug_1.default.transaction("Calling approveBySeller...");
                await (0, escrow_deploy_service_1.approveSellerBank)(updatedOrder.escrowAddress);
                debug_1.default.transaction("✅ Seller approval succeeded");
                approvalsSucceeded = true;
            }
            catch (approvalErr) {
                debug_1.default.info("Seller approval not supported (likely old contract)");
            }
            // Now try to release first 50% payment
            debug_1.default.transaction("Calling confirmShipment to release 50% payment...");
            const txResult = await (0, escrow_deploy_service_1.releaseFirstPayment)(updatedOrder.escrowAddress);
            debug_1.default.transaction("✅ First payment released - tx:", txResult.transactionHash);
            // Create payment release record AFTER blockchain call
            await prisma_1.prisma.paymentRelease.create({
                data: {
                    orderId,
                    type: "PARTIAL50",
                    amount: updatedOrder.total.div(2),
                    released: true,
                    releasedAt: new Date(),
                    transactionId: txResult.transactionHash,
                },
            });
            debug_1.default.service("BankService", "Payment release recorded in database");
        }
        catch (err) {
            debug_1.default.error("Failed to release payment on blockchain", err.message);
            // Log but don't throw - payment release attempt failed but order is marked IN_TRANSIT
            // This allows manual retry or investigation
        }
    }
    else if (updatedOrder.status === "IN_TRANSIT" &&
        !updatedOrder.escrowAddress) {
        // No escrow address - just create DB record
        await prisma_1.prisma.paymentRelease.create({
            data: {
                orderId,
                type: "PARTIAL50",
                amount: updatedOrder.total.div(2),
                released: true,
                releasedAt: new Date(),
            },
        });
    }
    return updatedOrder;
}
/** ---------- ORDERS ---------- */
/** Fetch all orders */
async function getOrders() {
    return prisma_1.prisma.order.findMany({
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
async function updateOrderApproval(orderId, data) {
    return prisma_1.prisma.$transaction(async (tx) => {
        const updates = { updatedAt: new Date() };
        if (data.action === "approve_buyer" && data.bankType === "buyer")
            updates.buyerBankApproved = true;
        if (data.action === "approve_seller" && data.bankType === "seller")
            updates.sellerBankApproved = true;
        if (data.action === "reject")
            updates.status = "CANCELLED";
        return tx.order.update({ where: { id: orderId }, data: updates });
    });
}
/** ---------- SHIPMENT & DELIVERY ---------- */
/** Confirm shipment */
async function confirmShipment(orderId, trackingId, notes) {
    return prisma_1.prisma.order.update({
        where: { id: orderId },
        data: { shipmentTrackingId: trackingId, updatedAt: new Date() },
    });
}
/** Confirm delivery and release remaining 50% payment */
async function confirmDelivery(orderId) {
    const order = await prisma_1.prisma.order.findUnique({ where: { id: orderId } });
    if (!order)
        throw new Error("Order not found");
    const remaining = order.total.div(2);
    await prisma_1.prisma.paymentRelease.create({
        data: {
            orderId,
            type: "FULL100",
            amount: remaining,
            released: true,
            releasedAt: new Date(),
        },
    });
    return prisma_1.prisma.order.update({
        where: { id: orderId },
        data: { status: "DELIVERED", updatedAt: new Date() },
    });
}
/** Get orders with workflow info */
// ---------- ORDERS ----------
async function getOrdersWithWorkflow() {
    const orders = await prisma_1.prisma.order.findMany({
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
    const formattedOrders = orders.map((o) => ({
        ...o,
        buyerBankId: o.buyerBank?.id,
        sellerBankId: o.sellerBank?.id,
    }));
    return formattedOrders;
}
/** GET /api/bank/banks */
async function getBanks() {
    return prisma_1.prisma.bank.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });
}
//# sourceMappingURL=bank.service.js.map