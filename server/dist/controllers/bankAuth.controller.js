"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBankUser = registerBankUser;
exports.loginBankUser = loginBankUser;
exports.logoutBankUser = logoutBankUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const prisma_1 = require("../utils/prisma");
// ✅ Types explicites pour lever l'ambiguïté des overloads
const BANK_JWT_SECRET = process.env.BANK_JWT_SECRET;
const BANK_COOKIE_NAME = process.env.BANK_COOKIE_NAME || "bankAccessToken";
const EXP = process.env.BANK_ACCESS_TOKEN_EXPIRY || "1d";
const signOpts = { expiresIn: EXP };
function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }
async function registerBankUser(req, res) {
    const { email, password, name, phone, bankId } = req.body || {};
    if (!email || !isEmail(email))
        return res.status(400).json({ message: "Invalid email" });
    if (!password || password.length < 8)
        return res.status(400).json({ message: "Password too short" });
    const exists = await prisma_1.prisma.userBank.findUnique({ where: { email } });
    if (exists)
        return res.status(400).json({ message: "Email already exists" });
    const hash = bcryptjs_1.default.hashSync(password, 10);
    const created = await prisma_1.prisma.userBank.create({
        data: { email, passwordHash: hash, name, phone, bankId },
        select: { id: true, email: true, name: true, phone: true, role: true, bankId: true, isBanned: true }
    });
    // ✅ jwt.sign typé
    const token = jwt.sign({ id: created.id, role: created.role }, BANK_JWT_SECRET, signOpts);
    res
        .cookie(BANK_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
    })
        .status(201)
        .json({ userBank: created });
}
async function loginBankUser(req, res) {
    const { email, password } = req.body || {};
    if (!email || !password)
        return res.status(400).json({ message: "Missing credentials" });
    const user = await prisma_1.prisma.userBank.findUnique({ where: { email } });
    if (!user || !(await bcryptjs_1.default.compare(password, user.passwordHash))) {
        return res.status(400).json({ message: "Wrong email or password" });
    }
    if (user.isBanned)
        return res.status(403).json({ message: "Account banned" });
    await prisma_1.prisma.userBank.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    // ✅ jwt.sign typé
    const token = jwt.sign({ id: user.id, role: user.role }, BANK_JWT_SECRET, signOpts);
    const { passwordHash, ...safe } = user;
    res
        .cookie(BANK_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
    })
        .json({ userBank: safe });
}
async function logoutBankUser(_req, res) {
    res.clearCookie(BANK_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    });
    res.json({ message: "Bank user logged out" });
}
//# sourceMappingURL=bankAuth.controller.js.map