"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerController = registerController;
exports.loginController = loginController;
exports.logoutController = logoutController;
exports.meController = meController;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-bank-secret-key";
const COOKIE_NAME = "bank_auth_token";
/**
 * POST /api/bank-auth/register
 * Register a new bank user
 */
async function registerController(req, res) {
    try {
        const { email, password, name, phone, bankId } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }
        // Check if user already exists
        const existing = await prisma.userBank.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ message: "User already exists" });
        }
        // For MVP: store password as-is (in production, use bcrypt)
        const user = await prisma.userBank.create({
            data: {
                email,
                passwordHash: password, // TODO: hash with bcrypt in production
                name: name || null,
                phone: phone || null,
                role: "BANK_USER",
                bankId: bankId || null,
            },
        });
        const payload = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            bankId: user.bankId,
        };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
        res.cookie(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        return res.status(201).json({
            message: "Registration successful",
            user: payload,
        });
    }
    catch (error) {
        console.error("Register error:", error);
        return res
            .status(500)
            .json({ message: "Registration failed", error: error.message });
    }
}
/**
 * POST /api/bank-auth/login
 * Login existing bank user
 */
async function loginController(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }
        const user = await prisma.userBank.findUnique({ where: { email } });
        if (!user || user.passwordHash !== password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const payload = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            bankId: user.bankId,
        };
        const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
        res.cookie(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.json({
            message: "Login successful",
            user: payload,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        return res
            .status(500)
            .json({ message: "Login failed", error: error.message });
    }
}
/**
 * GET /api/bank-auth/logout
 * Logout current bank user
 */
async function logoutController(req, res) {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });
    return res.json({ message: "Logout successful" });
}
/**
 * GET /api/bank-auth/me
 * Get current authenticated bank user
 */
async function meController(req, res) {
    try {
        const token = req.cookies[COOKIE_NAME];
        if (!token) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Optionally fetch fresh user data from DB
        const user = await prisma.userBank.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                bankId: true,
            },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.json({ user });
    }
    catch (error) {
        console.error("Me error:", error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
//# sourceMappingURL=bank-auth.controller.js.map