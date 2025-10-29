"use strict";
// src/types/auth.ts
// Centralized TypeScript type definitions for authentication-related data structures.
//
// Defines shared interfaces and type aliases used across controllers, services, middlewares, and utilities
// involved in the authentication and authorization flows.
// This ensures type safety and consistency for objects like JWT payloads, user data, and request contexts.
//
// Uses string union types (e.g., "PRODUCER" | "BUYER" | "ADMIN") instead of TypeScript enums
// to prevent potential mismatches with Prisma-generated enum types, ensuring compatibility across modules.
//
// Types Defined:
// - WalletType:      Union of supported wallet types ("hashpack", "metamask").
// - UserType:         Union of user roles on the platform ("PRODUCER", "BUYER", "ADMIN", "USER").
// - AuthResponse:    Structure of the JSON response sent back to the client after authentication attempts.
// - NonceResponse:    Structure of the JSON response containing the nonce and message for wallet signing.
// - JWTPayload:      Internal structure of the data stored within a JWT token.
// - AuthenticatedRequest: Extends the base Express Request type to include the `req.user` object,
//                          which is populated by the `verifyJWT` middleware upon successful authentication.
Object.defineProperty(exports, "__esModule", { value: true });
//# sourceMappingURL=auth.js.map