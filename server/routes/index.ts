import { Router } from "express";
import productRoutes from "./product.routes";
import cartRoutes from "./cart.routes";
import orderRoutes from "./order.routes";
import authRoutes from "./auth.routes";
import didRoutes from "./did.routes";
import documentRoutes from "./document.routes";
import profileRoutes from "./profile.routes";
import sessionRoutes from "./session.routes";
import web3nftRoutes from "./web3nft.routes";
import bankRoutes from "./bank.routes";
import bankAuthRoutes from "./bankAuth.routes";
import banksRoutes from "./banks.routes";
import bankAccountRoutes from "./bankAccount.routes";
import paymentApprovalRoutes from "./paymentApproval.routes";

const router = Router();

router.use("/bank-auth", bankAuthRoutes);
router.use("/banks", banksRoutes);
router.use("/bank-accounts", bankAccountRoutes);
router.use("/bank-payments", paymentApprovalRoutes);


// Bank routes
router.use("/bank", bankRoutes);

// Web3 NFT routes
router.use("/web3nft", web3nftRoutes);

// Product routes
router.use("/products", productRoutes);

// Cart routes
router.use("/carts", cartRoutes);

// Order routes
router.use("/orders", orderRoutes);

// Auth routes
router.use("/auth", authRoutes);

// DID routes
router.use("/did", didRoutes);

// Document routes
router.use("/documents", documentRoutes);

// Profile routes
router.use("/profile", profileRoutes);

// Session routes
router.use("/", sessionRoutes); // session routes are under /auth/refresh, /auth/logout, etc.

export default router;
