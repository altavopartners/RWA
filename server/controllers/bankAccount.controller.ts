import { Request, Response } from "express";
import { prisma } from "../utils/prisma";

const RIB_RE = /^\d{20}$/;
const NAME_RE = /^[\p{L}\s'-]{2,80}$/u;
const TN_RE = /^\+216\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIN_RE = /^[A-Z0-9\-]{5,12}$/;

export async function listMyBankAccounts(req: Request, res: Response) {
  const userId = (req as any).user.id; // ton middleware user existant
  const rows = await prisma.bankAccount.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  res.json(rows);
}

export async function addBankAccount(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const { bankCode, rib, holderName, phoneNumber, email, taxIdentificationNumber } = req.body || {};

  if (!bankCode) return res.status(400).json({ message: "bankCode required" });
  if (!RIB_RE.test(rib || "")) return res.status(400).json({ message: "RIB must be 20 digits" });
  if (!NAME_RE.test(holderName || "")) return res.status(400).json({ message: "Invalid holderName" });
  if (!TN_RE.test(phoneNumber || "")) return res.status(400).json({ message: "Invalid phoneNumber (+216XXXXXXXX)" });
  if (!EMAIL_RE.test(email || "")) return res.status(400).json({ message: "Invalid email" });
  if (taxIdentificationNumber && !TIN_RE.test(taxIdentificationNumber)) return res.status(400).json({ message: "Invalid taxIdentificationNumber" });

  const bank = await prisma.bank.findUnique({ where: { code: bankCode } });

  const created = await prisma.bankAccount.create({
    data: {
      userId,
      bankCode,
      bankId: bank?.id,
      rib,
      holderName,
      phoneNumber,
      email,
      taxIdentificationNumber: taxIdentificationNumber || null
    }
  });

  res.status(201).json(created);
}

export async function updateBankAccount(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const id = req.params.id;
  const account = await prisma.bankAccount.findUnique({ where: { id } });
  if (!account || account.userId !== userId) return res.status(404).json({ message: "Not found" });

  const { bankCode, rib, holderName, phoneNumber, email, taxIdentificationNumber } = req.body || {};
  const data: any = {};

  if (bankCode) {
    const bank = await prisma.bank.findUnique({ where: { code: bankCode } });
    data.bankCode = bankCode;
    data.bankId = bank?.id;
  }
  if (rib) { if (!RIB_RE.test(rib)) return res.status(400).json({ message: "Invalid RIB" }); data.rib = rib; }
  if (holderName) { if (!NAME_RE.test(holderName)) return res.status(400).json({ message: "Invalid holderName" }); data.holderName = holderName; }
  if (phoneNumber) { if (!TN_RE.test(phoneNumber)) return res.status(400).json({ message: "Invalid phoneNumber" }); data.phoneNumber = phoneNumber; }
  if (email) { if (!EMAIL_RE.test(email)) return res.status(400).json({ message: "Invalid email" }); data.email = email; }
  if (taxIdentificationNumber !== undefined) {
    if (taxIdentificationNumber && !TIN_RE.test(taxIdentificationNumber)) return res.status(400).json({ message: "Invalid taxIdentificationNumber" });
    data.taxIdentificationNumber = taxIdentificationNumber || null;
  }

  const updated = await prisma.bankAccount.update({ where: { id }, data });
  res.json(updated);
}

export async function deleteBankAccount(req: Request, res: Response) {
  const userId = (req as any).user.id;
  const id = req.params.id;
  const account = await prisma.bankAccount.findUnique({ where: { id } });
  if (!account || account.userId !== userId) return res.status(404).json({ message: "Not found" });

  await prisma.bankAccount.delete({ where: { id } });
  res.json({ ok: true });
}
