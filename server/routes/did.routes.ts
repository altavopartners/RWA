// src/routes/did.routes.ts
// Defines REST API endpoints for Decentralized Identifier (DID) operations under `/api/did`.
//
// All routes are protected and require a valid JWT (verified by `verifyJWT` middleware).
// Endpoints:
// - POST /register  -> Create/Register a new DID for the authenticated user.
// - GET /           -> Retrieve the DID document/metadata for the authenticated user.
// - PUT /metadata   -> Update custom metadata associated with the user's DID.

import { Router } from "express";
import { verifyJWT } from "../middleware/auth";
import { registerDidController, getDidController, updateDidMetadataController } from "../controllers/did.controller";

const router = Router();

router.post("/register", verifyJWT, registerDidController);
router.get("/", verifyJWT, getDidController);
router.put("/metadata", verifyJWT, updateDidMetadataController);

export default router;
