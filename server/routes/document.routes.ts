// src/routes/document.routes.ts
import { Router } from "express";
import { verifyJWT } from "../middleware/auth";
import {
  uploadDocumentController,
  uploadDocumentMiddleware,
  downloadDocumentController,
  getDocumentsByOrderIdController,
} from "../controllers/document.controller";

const router = Router();

router.post(
  "/upload",
  verifyJWT,
  uploadDocumentMiddleware,
  uploadDocumentController
);
router.get("/", verifyJWT, getDocumentsByOrderIdController);
router.get("/:cid/download", downloadDocumentController);

export default router;
