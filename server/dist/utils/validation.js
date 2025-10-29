"use strict";
// src/utils/validation.ts
// Centralized Zod schema definitions for request body validation.
//
// Uses the `zod` library to define strict schemas for incoming data.
// Schemas:
// - `CoreIdentitySchema`: For initial user identity details (full name, email, phone, location).
// - `ProgressiveProfileSchema`: For additional profile information (image URL, business details).
// Imported and used by controllers (e.g., `auth.controller.ts`) to parse and validate `req.body`
// before processing, ensuring type safety and data integrity at the API boundary.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressiveProfileSchema = exports.CoreIdentitySchema = void 0;
const zod_1 = require("zod");
exports.CoreIdentitySchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    phoneNumber: zod_1.z.string().min(6),
    location: zod_1.z.string().min(2),
});
exports.ProgressiveProfileSchema = zod_1.z.object({
    profileImage: zod_1.z.string().url().optional(),
    businessName: zod_1.z.string().max(200).optional(),
    businessDesc: zod_1.z.string().max(2000).optional(),
});
//# sourceMappingURL=validation.js.map