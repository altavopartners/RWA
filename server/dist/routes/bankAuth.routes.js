"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bankAuth_controller_1 = require("../controllers/bankAuth.controller");
//import { verifyBankToken } from "../middleware/verifyToken";
const r = (0, express_1.Router)();
r.post("/register", bankAuth_controller_1.registerBankUser);
r.post("/login", bankAuth_controller_1.loginBankUser);
r.get("/logout", bankAuth_controller_1.logoutBankUser);
exports.default = r;
//# sourceMappingURL=bankAuth.routes.js.map