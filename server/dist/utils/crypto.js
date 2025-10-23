"use strict";
// src/utils/crypto.ts
// Low-level cryptographic utility functions.
//
// Provides helpers for:
// - Generating secure nonces (random strings) for authentication challenges.
// - Creating standardized, user-friendly messages for wallets to sign.
// - Basic validation of Hedera (`0.0.x`) and Ethereum (`0x...`) wallet address formats.
// - Validating an address based on a specified `WalletType`.
// - Retrieving the JWT secret from environment variables.
// - Simple SHA-256 hashing.
// - Checking if a generated nonce (based on a timestamp) is still valid (e.g., within 10 minutes).
// Used by authentication services and controllers.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNonceValid = exports.hashData = exports.getJWTSecret = exports.validateWalletAddress = exports.isValidEthereumAddress = exports.isValidHederaAddress = exports.createSignatureMessage = exports.generateNonce = void 0;
const crypto_1 = __importDefault(require("crypto"));
/** Generate a secure nonce (default 32 bytes -> 64 hex chars) */
const generateNonce = (length = 32) => {
    return crypto_1.default.randomBytes(length).toString("hex");
};
exports.generateNonce = generateNonce;
/** Create a human-friendly message to sign (explicit and clear) */
const createSignatureMessage = (walletAddress, nonce, timestamp) => {
    return `Hex-Port Authentication\n\nWallet: ${walletAddress}\nNonce: ${nonce}\nIssued: ${new Date(timestamp).toISOString()}\n\nThis message will not trigger a blockchain transaction.`;
};
exports.createSignatureMessage = createSignatureMessage;
/** Validate Hedera account format (very simple check) */
const isValidHederaAddress = (addr) => {
    return /^0\.0\.\d+$/.test(addr);
};
exports.isValidHederaAddress = isValidHederaAddress;
/** Validate Ethereum address (MetaMask) */
const isValidEthereumAddress = (addr) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
};
exports.isValidEthereumAddress = isValidEthereumAddress;
/** Validate based on wallet type */
const validateWalletAddress = (addr, walletType) => {
    if (walletType === "hashpack")
        return (0, exports.isValidHederaAddress)(addr);
    if (walletType === "metamask")
        return (0, exports.isValidEthereumAddress)(addr);
    return false;
};
exports.validateWalletAddress = validateWalletAddress;
/** Get JWT secret from env or throw */
const getJWTSecret = () => {
    const s = process.env.JWT_SECRET;
    // Production: require strong secret
    if (process.env.NODE_ENV === "production") {
        if (!s || s.length < 32) {
            throw new Error("JWT_SECRET must be set in production and be at least 32 characters long");
        }
        return s;
    }
    // Development: warn if using default
    if (!s) {
        console.warn("⚠️  JWT_SECRET not set. Using default for development. " +
            "DO NOT USE IN PRODUCTION!");
        return "dev-secret-please-change-in-production-min-32-chars";
    }
    if (s.length < 32) {
        console.warn(`⚠️  JWT_SECRET is only ${s.length} characters. ` +
            "Recommended minimum is 32 characters.");
    }
    return s;
};
exports.getJWTSecret = getJWTSecret;
/** Simple SHA-256 hash helper */
const hashData = (data) => {
    return crypto_1.default.createHash("sha256").update(data).digest("hex");
};
exports.hashData = hashData;
/** Nonce expiration check (createdAt is when nonce was set on user.updatedAt) */
const isNonceValid = (updatedAt, expirationMinutes = 10) => {
    if (!updatedAt)
        return false;
    const now = Date.now();
    const expiry = new Date(updatedAt).getTime() + expirationMinutes * 60 * 1000;
    return now < expiry;
};
exports.isNonceValid = isNonceValid;
//# sourceMappingURL=crypto.js.map