"use strict";
// src/utils/message.ts
// Canonical message builder for wallet signature during authentication.
//
// Defines a single, standardized function `generateAuthMessage` to create the exact string
// that users must sign with their wallet. This ensures the frontend and backend generate
// identical messages for the signature verification process to work correctly.
// Includes wallet address, user role, nonce, timestamp, and a disclaimer.
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAuthMessage = generateAuthMessage;
function generateAuthMessage(walletAddress, nonce, userType) {
    const now = new Date().toISOString();
    return `Sign in to Hex-Port\n\nWallet: ${walletAddress}\nRole: ${userType}\nNonce: ${nonce}\nTime: ${now}\n\nBy signing, you confirm ownership of this wallet. No blockchain transaction will occur.`;
}
//# sourceMappingURL=message.js.map