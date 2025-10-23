// server/controllers/bank-auth.controller.ts
import { Request, Response } from "express";
import { PrismaClient, BankUserRole } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-bank-secret-key";
const COOKIE_NAME = "bank_auth_token";

interface BankAuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: BankUserRole;
  bankId?: string | null;
}

/**
 * POST /api/bank-auth/register
 * Register a new bank user
 */
export async function registerController(req: Request, res: Response) {
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

    const payload: BankAuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      bankId: user.bankId,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

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
  } catch (error: any) {
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
export async function loginController(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await prisma.userBank.findUnique({ where: { email } });

    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload: BankAuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      bankId: user.bankId,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

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
  } catch (error: any) {
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
export async function logoutController(req: Request, res: Response) {
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
export async function meController(req: Request, res: Response) {
  try {
    const token = req.cookies[COOKIE_NAME];

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as BankAuthUser;

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
  } catch (error: any) {
    console.error("Me error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
