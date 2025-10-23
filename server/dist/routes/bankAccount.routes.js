"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bankAccount_controller_1 = require("../controllers/bankAccount.controller");
// TON middleware user existant (pas banque) :
const verifyToken_1 = require("../middleware/verifyToken");
const r = (0, express_1.Router)();
r.get("/", verifyToken_1.verifyBankToken, bankAccount_controller_1.listMyBankAccounts);
r.post("/", verifyToken_1.verifyBankToken, bankAccount_controller_1.addBankAccount);
r.patch("/:id", verifyToken_1.verifyBankToken, bankAccount_controller_1.updateBankAccount);
r.delete("/:id", verifyToken_1.verifyBankToken, bankAccount_controller_1.deleteBankAccount);
exports.default = r;
//# sourceMappingURL=bankAccount.routes.js.map