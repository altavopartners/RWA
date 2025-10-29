"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyBankToken = verifyBankToken;
exports.verifyBankAdmin = verifyBankAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const BANK_JWT_SECRET = process.env.BANK_JWT_SECRET;
const BANK_COOKIE_NAME = process.env.BANK_COOKIE_NAME || "bankAccessToken";
function verifyBankToken(req, res, next) {
    const token = req.cookies?.[BANK_COOKIE_NAME];
    if (!token)
        return res.status(401).json({ message: "Not authenticated (bank)" });
    try {
        const payload = jsonwebtoken_1.default.verify(token, BANK_JWT_SECRET);
        req.bankUser = payload;
        next();
    }
    catch {
        res.status(403).json({ message: "Invalid bank token" });
    }
}
function verifyBankAdmin(req, res, next) {
    verifyBankToken(req, res, () => {
        if (req.bankUser?.role === "BANK_ADMIN")
            return next();
        res.status(403).json({ message: "Bank admin only" });
    });
}
//# sourceMappingURL=verifyToken.js.map