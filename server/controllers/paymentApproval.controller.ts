import { Request, Response } from "express";
import { prisma } from "../utils/prisma";

export async function approvePayment(req: Request, res: Response) {
  const actorId = req.bankUser!.id;
  const { paymentReleaseId, comments } = req.body || {};
  const pr = await prisma.paymentRelease.findUnique({ where: { id: paymentReleaseId } });
  if (!pr) return res.status(404).json({ message: "Payment release not found" });

  const approval = await prisma.paymentApproval.create({
    data: { paymentReleaseId, actorId, action: "APPROVE", comments }
  });

  // exemple: marquer comme released
  const updated = await prisma.paymentRelease.update({
    where: { id: paymentReleaseId },
    data: { released: true, releasedAt: new Date() }
  });

  res.json({ approval, paymentRelease: updated });
}

export async function rejectPayment(req: Request, res: Response) {
  const actorId = req.bankUser!.id;
  const { paymentReleaseId, comments } = req.body || {};
  const pr = await prisma.paymentRelease.findUnique({ where: { id: paymentReleaseId } });
  if (!pr) return res.status(404).json({ message: "Payment release not found" });

  const approval = await prisma.paymentApproval.create({
    data: { paymentReleaseId, actorId, action: "REJECT", comments }
  });

  res.json({ approval });
}
