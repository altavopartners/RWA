import { Router } from "express";
import productRoutes from "./product";
import authRoutes from "./auth.routes";
import didRoutes from "./did.routes";
import documentRoutes from "./document.routes";
import profileRoutes from "./profile.routes";
import sessionRoutes from "./session.routes";

const router = Router();

// Product routes
router.use("/products", productRoutes);

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
