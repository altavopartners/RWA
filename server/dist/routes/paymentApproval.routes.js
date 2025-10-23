"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentApproval_controller_1 = require("../controllers/paymentApproval.controller");
const verifyToken_1 = require("../middleware/verifyToken");
const r = (0, express_1.Router)();
r.post("/approve", verifyToken_1.verifyBankToken, paymentApproval_controller_1.approvePayment);
r.post("/reject", verifyToken_1.verifyBankToken, paymentApproval_controller_1.rejectPayment);
exports.default = r;
//# sourceMappingURL=paymentApproval.routes.js.map