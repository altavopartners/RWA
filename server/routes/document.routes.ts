// src/routes/document.routes.ts
// Defines REST API endpoints for user document handling under `/api/documents`.
//
// Endpoints:
// - POST /upload       -> Upload a new document for the authenticated user.
//                        Requires JWT auth (`verifyJWT`) and handles file upload via `multer`.
// - GET /:cid/download  -> Download a document using its IPFS Content Identifier (CID).
//                        Publicly accessible link, returns the file bytes.

import { Router } from "express";
import { verifyJWT } from "../middleware/auth";
import { uploadDocumentController, uploadDocumentMiddleware, downloadDocumentController } from "../controllers/document.controller";

const router = Router();

router.post("/upload", verifyJWT, uploadDocumentMiddleware, uploadDocumentController);
router.get("/:cid/download", downloadDocumentController);

export default router;
