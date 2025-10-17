import { Router } from "express";
import { approvePayment, rejectPayment } from "../controllers/paymentApproval.controller";
import { verifyBankToken } from "../middleware/verifyToken";

const r = Router();
r.post("/approve", verifyBankToken, approvePayment);
r.post("/reject", verifyBankToken, rejectPayment);
export default r;
