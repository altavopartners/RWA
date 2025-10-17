import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma";

// ✅ Types explicites pour lever l'ambiguïté des overloads
const BANK_JWT_SECRET: jwt.Secret = (process.env.BANK_JWT_SECRET as string);
const BANK_COOKIE_NAME = process.env.BANK_COOKIE_NAME || "bankAccessToken";
const EXP: jwt.SignOptions["expiresIn"] =
  (process.env.BANK_ACCESS_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"]) || "1d";
const signOpts: jwt.SignOptions = { expiresIn: EXP };

function isEmail(s: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }

export async function registerBankUser(req: Request, res: Response) {
  const { email, password, name, phone, bankId } = req.body || {};
  if (!email || !isEmail(email)) return res.status(400).json({ message: "Invalid email" });
  if (!password || password.length < 8) return res.status(400).json({ message: "Password too short" });

  const exists = await prisma.userBank.findUnique({ where: { email } });
  if (exists) return res.status(400).json({ message: "Email already exists" });

  const hash = bcrypt.hashSync(password, 10);
  const created = await prisma.userBank.create({
    data: { email, passwordHash: hash, name, phone, bankId },
    select: { id: true, email: true, name: true, phone: true, role: true, bankId: true, isBanned: true }
  });

  // ✅ jwt.sign typé
  const token = jwt.sign({ id: created.id, role: created.role }, BANK_JWT_SECRET, signOpts);

  res
    .cookie(BANK_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    })
    .status(201)
    .json({ userBank: created });
}

export async function loginBankUser(req: Request, res: Response) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "Missing credentials" });

  const user = await prisma.userBank.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(400).json({ message: "Wrong email or password" });
  }
  if (user.isBanned) return res.status(403).json({ message: "Account banned" });

  await prisma.userBank.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  // ✅ jwt.sign typé
  const token = jwt.sign({ id: user.id, role: user.role }, BANK_JWT_SECRET, signOpts);
  const { passwordHash, ...safe } = user as any;

  res
    .cookie(BANK_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    })
    .json({ userBank: safe });
}

export async function logoutBankUser(_req: Request, res: Response) {
  res.clearCookie(BANK_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ message: "Bank user logged out" });
}
