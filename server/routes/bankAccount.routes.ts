import { Router } from "express";
import { listMyBankAccounts, addBankAccount, updateBankAccount, deleteBankAccount } from "../controllers/bankAccount.controller";
// TON middleware user existant (pas banque) :
import { verifyBankToken } from "../middleware/verifyToken";

const r = Router();
r.get("/", verifyBankToken, listMyBankAccounts);
r.post("/", verifyBankToken, addBankAccount);
r.patch("/:id", verifyBankToken, updateBankAccount);
r.delete("/:id", verifyBankToken, deleteBankAccount);
export default r;
