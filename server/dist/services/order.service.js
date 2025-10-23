"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutError = void 0;
exports.passOrderService = passOrderService;
exports.getAllMyOrdersService = getAllMyOrdersService;
exports.updateOrderStatusService = updateOrderStatusService;
exports.getMyOrderByIdService = getMyOrderByIdService;
// services/order.service.ts
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client");
const escrow_deploy_service_1 = require("./escrow-deploy.service");
class CheckoutError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.name = "CheckoutError";
        this.status = status;
    }
}
exports.CheckoutError = CheckoutError;
// ---------- Order Code Generator ----------
async function generateOrderCode(tx) {
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const startOfNextYear = new Date(year + 1, 0, 1);
    const yearlyCount = await tx.order.count({
        where: { createdAt: { gte: startOfYear, lt: startOfNextYear } },
    });
    const padded = String(yearlyCount + 1).padStart(6, "0");
    return `ORD-${year}-${padded}`;
}
// ---------- Create Order from Cart ----------
async function passOrderService({ userId, shipping = 5.0, }) {
    return prisma_1.default.$transaction(async (tx) => {
        const cartItems = await tx.cartItem.findMany({
            where: { userId },
            include: { product: true },
        });
        if (cartItems.length === 0) {
            throw new CheckoutError("Your cart is empty.", 400);
        }
        for (const ci of cartItems) {
            if (ci.quantity <= 0) {
                throw new CheckoutError(`Invalid quantity for product ${ci.productId}.`, 400);
            }
            if (ci.product.quantity < ci.quantity) {
                throw new CheckoutError(`Insufficient stock for "${ci.product.name}".`, 409);
            }
        }
        // Ensure buyer exists
        const buyerExists = await tx.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!buyerExists) {
            throw new CheckoutError("Buyer not found.", 404);
        }
        // Extract unique producer wallet IDs from cart items
        const producerWalletIds = [
            ...new Set(cartItems
                .map((ci) => ci.product.producerWalletId)
                .filter((id) => !!id)),
        ];
        if (producerWalletIds.length === 0) {
            throw new CheckoutError("Products missing producer information. Cannot process order.", 400);
        }
        // For now, support single-seller orders only
        if (producerWalletIds.length > 1) {
            throw new CheckoutError("Multi-seller orders not supported yet. Please order from one producer at a time.", 400);
        }
        // Ensure the seller (producer) exists
        const sellerExists = await tx.user.findFirst({
            where: {
                walletAddress: producerWalletIds[0],
                userType: "PRODUCER",
            },
            select: { id: true },
        });
        if (!sellerExists) {
            throw new CheckoutError("Producer not found for this order. Contact support.", 404);
        }
        // Assign banks: use any configured bank (demo-friendly fallback)
        const anyBank = await tx.bank.findFirst();
        if (!anyBank) {
            throw new CheckoutError("No banks configured. Please seed or create at least one bank.", 500);
        }
        const buyerBankIdToUse = anyBank.id;
        const sellerBankIdToUse = anyBank.id;
        const toDecimal = (n) => new client_1.Prisma.Decimal(n);
        const subtotal = cartItems.reduce((acc, ci) => acc.add(toDecimal(ci.product.pricePerUnit).mul(ci.quantity)), toDecimal(0));
        const shippingD = toDecimal(shipping ?? 0);
        const total = subtotal.add(shippingD);
        let order = null;
        const MAX_RETRIES = 2;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            const code = await generateOrderCode(tx);
            try {
                order = await tx.order.create({
                    data: {
                        code,
                        userId,
                        status: client_1.OrderStatus.AWAITING_PAYMENT, // Start awaiting payment; move to BANK_REVIEW after on-chain payment
                        subtotal,
                        shipping: shippingD,
                        total,
                        buyerBankId: buyerBankIdToUse, // Ensure buyer's bank exists
                        sellerBankId: sellerBankIdToUse, // Ensure seller's bank exists
                        items: {
                            create: cartItems.map((ci) => ({
                                productId: ci.productId,
                                quantity: ci.quantity,
                                unitPrice: toDecimal(ci.product.pricePerUnit),
                                lineTotal: toDecimal(ci.product.pricePerUnit).mul(ci.quantity),
                            })),
                        },
                    },
                    include: { items: true },
                });
                break;
            }
            catch (err) {
                if (err instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                    err.code === "P2002" &&
                    Array.isArray(err.meta?.target) &&
                    err.meta.target.includes("code")) {
                    if (attempt === MAX_RETRIES) {
                        throw new CheckoutError("Could not generate unique order code.", 500);
                    }
                }
                else
                    throw err;
            }
        }
        if (!order)
            throw new CheckoutError("Unknown error during order creation.", 500);
        // Decrement stock
        for (const ci of cartItems) {
            const updated = await tx.product.updateMany({
                where: { id: ci.productId, quantity: { gte: ci.quantity } },
                data: { quantity: { decrement: ci.quantity } },
            });
            if (updated.count !== 1) {
                throw new CheckoutError(`Stock changed while checking out for "${ci.product.name}". Please retry.`, 409);
            }
        }
        await tx.cartItem.deleteMany({ where: { userId } });
        // Deploy escrow contract for this order
        try {
            const buyerUser = await tx.user.findUnique({
                where: { id: userId },
                select: { walletAddress: true },
            });
            const sellerWalletAddress = producerWalletIds[0];
            if (!buyerUser?.walletAddress) {
                console.warn(`⚠️  Order ${order.id}: Buyer wallet not found, skipping escrow deployment`);
            }
            else if (!sellerWalletAddress) {
                console.warn(`⚠️  Order ${order.id}: Seller wallet not found, skipping escrow deployment`);
            }
            else {
                console.log(`🚀 Deploying escrow for order ${order.id}...`);
                const escrowResult = await (0, escrow_deploy_service_1.deployEscrowContract)({
                    buyerAddress: buyerUser.walletAddress,
                    sellerAddress: sellerWalletAddress,
                    totalAmount: total.toString(), // HBAR amount as string
                });
                // Save escrow address to order
                await tx.order.update({
                    where: { id: order.id },
                    data: {
                        escrowAddress: escrowResult.contractAddress,
                        hederaTransactionId: escrowResult.transactionHash,
                    },
                });
                console.log(`✅ Escrow deployed at ${escrowResult.contractAddress} for order ${order.id}`);
            }
        }
        catch (escrowError) {
            // Log error but don't fail order creation
            console.error(`❌ Failed to deploy escrow for order ${order.id}:`, escrowError.message);
            // Order is still created, escrow can be deployed manually later
        }
        return order;
    });
}
async function getAllMyOrdersService({ userId, page = 1, pageSize = 20, status, }) {
    const take = Math.min(Math.max(pageSize, 1), 100);
    const skip = Math.max(page - 1, 0) * take;
    const where = {
        userId,
        ...(status ? { status } : {}),
    };
    const [orders, total] = await prisma_1.default.$transaction([
        prisma_1.default.order.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
            include: { items: { include: { product: true } }, documents: true },
        }),
        prisma_1.default.order.count({ where }),
    ]);
    return {
        orders,
        page,
        pageSize: take,
        total,
        pageCount: Math.max(1, Math.ceil(total / take)),
    };
}
// ---------- Update Order Status ----------
async function updateOrderStatusService({ orderId, status, userId, }) {
    // TEMP: log for debugging
    console.log("Service: updateOrderStatusService", { orderId, userId, status });
    // Verify order belongs to user
    const order = await prisma_1.default.order.findFirst({
        where: { id: orderId, userId },
    });
    if (!order) {
        console.log("Order not found or user mismatch in DB");
        throw new CheckoutError("Order not found.", 404);
    }
    const updatedOrder = await prisma_1.default.order.update({
        where: { id: orderId },
        data: { status },
        include: { items: true, documents: true },
    });
    return updatedOrder;
}
// ---------- Get My Order By ID ----------
async function getMyOrderByIdService({ userId, id, }) {
    const order = await prisma_1.default.order.findFirst({
        where: { id, userId },
        include: { items: { include: { product: true } }, documents: true },
    });
    if (!order)
        throw new CheckoutError("Order not found.", 404);
    return order;
}
//# sourceMappingURL=order.service.js.map