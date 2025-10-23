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
import bankRoutes from "./bank.routes"; // ← added
import bankAuthRoutes from "./bank-auth.routes";

const router = Router();

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

// Bank routes
router.use("/bank", bankRoutes); // ← added

// Bank auth routes
router.use("/bank-auth", bankAuthRoutes);

export default router;
