import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const BANK_JWT_SECRET = process.env.BANK_JWT_SECRET!;
const BANK_COOKIE_NAME = process.env.BANK_COOKIE_NAME || "bankAccessToken";

declare global {
  namespace Express {
    interface Request {
      bankUser?: { id: string; role: "BANK_USER" | "BANK_ADMIN" };
    }
  }
}

export function verifyBankToken(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[BANK_COOKIE_NAME];
  if (!token) return res.status(401).json({ message: "Not authenticated (bank)" });
  try {
    const payload = jwt.verify(token, BANK_JWT_SECRET) as { id: string; role: "BANK_USER" | "BANK_ADMIN" };
    req.bankUser = payload;
    next();
  } catch {
    res.status(403).json({ message: "Invalid bank token" });
  }
}

export function verifyBankAdmin(req: Request, res: Response, next: NextFunction) {
  verifyBankToken(req, res, () => {
    if (req.bankUser?.role === "BANK_ADMIN") return next();
    res.status(403).json({ message: "Bank admin only" });
  });
}
