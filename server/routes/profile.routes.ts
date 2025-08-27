// src/routes/profile.routes.ts
// Defines REST API endpoints for user profile management under `/api/profile`.
//
// All routes are protected and require a valid JWT (verified by `verifyJWT` middleware).
// Endpoints:
// - GET /    -> Retrieve the complete profile of the authenticated user.
// - PUT /    -> Update the profile fields (name, email, business info, etc.) of the authenticated user.

import { Router } from "express";
import { verifyJWT } from "../middleware/auth";
import { getProfileController, updateProfileController } from "../controllers/profile.controller";

const router = Router();

router.get("/", verifyJWT, getProfileController);
router.put("/", verifyJWT, updateProfileController);

export default router;
