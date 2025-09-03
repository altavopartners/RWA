// src/routes/profile.routes.ts
import { Router } from "express";
import { verifyJWT } from "../middleware/auth";
import {
  getProfileController,
  updateProfileController,
} from "../controllers/auth.controller";

const router = Router();

// GET full profile
router.get("/", verifyJWT, getProfileController);

// PUT update profile (core + progressive fields in one request)
router.put("/", verifyJWT, updateProfileController);

export default router;
