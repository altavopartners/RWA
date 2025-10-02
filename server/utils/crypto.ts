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

import crypto from "crypto";
import { WalletType } from "../types/auth";

/** Generate a secure nonce (default 32 bytes -> 64 hex chars) */
export const generateNonce = (length = 32): string => {
  return crypto.randomBytes(length).toString("hex");
};

/** Create a human-friendly message to sign (explicit and clear) */
export const createSignatureMessage = (
  walletAddress: string,
  nonce: string,
  timestamp: number
): string => {
  return `Hex-Port Authentication\n\nWallet: ${walletAddress}\nNonce: ${nonce}\nIssued: ${new Date(
    timestamp
  ).toISOString()}\n\nThis message will not trigger a blockchain transaction.`;
};

/** Validate Hedera account format (very simple check) */
export const isValidHederaAddress = (addr: string): boolean => {
  return /^0\.0\.\d+$/.test(addr);
};

/** Validate Ethereum address (MetaMask) */
export const isValidEthereumAddress = (addr: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
};

/** Validate based on wallet type */
export const validateWalletAddress = (addr: string, walletType: WalletType): boolean => {
  if (walletType === "hashpack") return isValidHederaAddress(addr);
  if (walletType === "metamask") return isValidEthereumAddress(addr);
  return false;
};

/** Get JWT secret from env or throw */
export const getJWTSecret = (): string => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not defined");
  return s;
};

/** Simple SHA-256 hash helper */
export const hashData = (data: string): string => {
  return crypto.createHash("sha256").update(data).digest("hex");
};

/** Nonce expiration check (createdAt is when nonce was set on user.updatedAt) */
export const isNonceValid = (updatedAt?: Date | null, expirationMinutes = 10): boolean => {
  if (!updatedAt) return false;
  const now = Date.now();
  const expiry = new Date(updatedAt).getTime() + expirationMinutes * 60 * 1000;
  return now < expiry;
};
