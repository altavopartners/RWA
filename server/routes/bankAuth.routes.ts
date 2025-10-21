import { Router } from "express";
import { registerBankUser, loginBankUser, logoutBankUser } from "../controllers/bankAuth.controller";
//import { verifyBankToken } from "../middleware/verifyToken";
const r = Router();
r.post("/register", registerBankUser);
r.post("/login", loginBankUser);
//r.get("/logout", logoutBankUser);
export default r;
