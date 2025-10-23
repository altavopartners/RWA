// src/controllers/document.controller.ts
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types/auth";
import multer from "multer";
import {
  saveDocumentForUser,
  fetchDocumentBytes,
} from "../services/document.service";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

export const uploadDocumentMiddleware = upload.single("file");

/** POST /api/documents/upload */
export async function uploadDocumentController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!req.file)
      return res.status(400).json({ success: false, message: "file required" });
    const { originalname, buffer, mimetype } = req.file;
    const result = await saveDocumentForUser(
      req.user.id,
      originalname,
      buffer,
      mimetype,
      req.body.categoryKey,
      req.body.typeKey,
      req.body.orderId
    );
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res
      .status(400)
      .json({ success: false, message: err?.message ?? "Upload failed" });
  }
}

/** GET /api/documents?orderId=xxx */
export async function getDocumentsByOrderIdController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { orderId } = req.query;
    if (!orderId || typeof orderId !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "orderId required" });
    }

    const { prisma } = await import("../utils/prisma");
    const documents = await prisma.document.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, documents });
  } catch (err: any) {
    return res
      .status(500)
      .json({
        success: false,
        message: err?.message ?? "Failed to fetch documents",
      });
  }
}

/** GET /api/documents/:cid/download */
export async function downloadDocumentController(req: Request, res: Response) {
  try {
    const { cid } = req.params;
    if (!cid)
      return res.status(400).json({ success: false, message: "cid required" });

    const bytes = await fetchDocumentBytes(cid);
    res.setHeader("Content-Disposition", `attachment; filename="${cid}"`);
    return res.send(bytes);
  } catch (err: any) {
    return res
      .status(404)
      .json({ success: false, message: err?.message ?? "Not found" });
  }
}
