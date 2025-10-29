// src/routes/did.routes.ts
// Defines REST API endpoints for Decentralized Identifier (DID) operations under `/api/did`.
//
// All routes are protected and require a valid JWT (verified by `verifyJWT` middleware).
// Endpoints:
// - POST /register  -> Create/Register a new DID for the authenticated user.
// - GET /           -> Retrieve the DID document/metadata for the authenticated user.
// - PUT /metadata   -> Update custom metadata associated with the user's DID.

import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { registerDidForUser, getUserDid, updateUserDidMetadata } from "../services/did.service";

export async function registerDidController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Auth required" });
    const metadata = (req.body?.metadata ?? {}) as Record<string, unknown>;
    const record = await registerDidForUser(req.user.id, metadata);
    return res.json({ success: true, data: record });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function getDidController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Auth required" });
    const record = await getUserDid(req.user.id);
    return res.json({ success: true, data: record });
  } catch (err: any) {
    return res.status(404).json({ success: false, message: err.message });
  }
}

export async function updateDidMetadataController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Auth required" });
    const metadata = (req.body?.metadata ?? {}) as Record<string, unknown>;
    const updated = await updateUserDidMetadata(req.user.id, metadata);
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
}
