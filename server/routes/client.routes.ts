import { Router } from "express";
import {
  getClientsController,
  updateClientKycController,
} from "../controllers/client.controller";

const router = Router();

router.get("/clients", getClientsController);
router.post("/clients/:id/kyc", updateClientKycController);

export default router;
