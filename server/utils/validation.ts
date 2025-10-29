// src/utils/validation.ts
// Centralized Zod schema definitions for request body validation.
//
// Uses the `zod` library to define strict schemas for incoming data.
// Schemas:
// - `CoreIdentitySchema`: For initial user identity details (full name, email, phone, location).
// - `ProgressiveProfileSchema`: For additional profile information (image URL, business details).
// Imported and used by controllers (e.g., `auth.controller.ts`) to parse and validate `req.body`
// before processing, ensuring type safety and data integrity at the API boundary.

import { z } from "zod";

export const CoreIdentitySchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phoneNumber: z.string().min(6),
  location: z.string().min(2),
});

export const ProgressiveProfileSchema = z.object({
  profileImage: z.string().url().optional(),
  businessName: z.string().max(200).optional(),
  businessDesc: z.string().max(2000).optional(),
});
