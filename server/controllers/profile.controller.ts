// src/controllers/profile.controller.ts
// Controller layer handling HTTP requests for fetching and updating user profile information.
//
// - `getProfileController`: Fetches the full profile details for the user identified by `req.user.id`
//                           (attached by the `verifyJWT` middleware). Delegates to `profile.service.getProfile`.
// - `updateProfileController`: Updates the profile fields for the user identified by `req.user.id`
//                               using data from `req.body`. Delegates to `profile.service.updateProfile`.
// Requires authentication; relies on `req.user` being populated.

import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types/auth";
import { getProfile, updateProfile } from "../services/profile.service";

export async function getProfileController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const profile = await getProfile(req.user.id);
    return res.json({ success: true, data: profile });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function updateProfileController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
    const updated = await updateProfile(req.user.id, req.body);
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
}
