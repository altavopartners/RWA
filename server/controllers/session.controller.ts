// src/controllers/session.controller.ts
// Controller layer handling HTTP requests for authentication session lifecycle endpoints.
//
// - `refreshSessionController`: Accepts a refresh token, validates it using `JWTUtils`,
//                                retrieves the associated session from `SessionService`,
//                                generates new access/refresh token pair, updates the session
//                                in the database via `SessionService`, and returns the new tokens.
// - `logoutController`:         Extracts the access token from the Authorization header,
//                                finds the corresponding session via `SessionService`,
//                                and marks it as inactive/invalid.
// - `logoutAllController`:      Retrieves the user ID from the authenticated request (relies on `req.user`),
//                                and instructs `SessionService` to mark all active sessions for that user as inactive.
import { Request, Response } from "express";
import { SessionService } from "../services/session.service";
import { JWTUtils } from "../utils/jwt"; // Import JWTUtils instead of verifyToken

export async function refreshSessionController(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required"
      });
    }

    // Find session by refresh token
    const session = await SessionService.findByRefreshToken(refreshToken);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token"
      });
    }

    // Verify the refresh token is valid
    try {
      JWTUtils.verify(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token"
      });
    }

    // Extract payload from refresh token to create new tokens
    const payload = JWTUtils.decode(refreshToken);
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token payload"
      });
    }

    // Generate new tokens using JWTUtils
    const newAccessToken = JWTUtils.sign({
      userId: payload.userId,
      walletAddress: payload.walletAddress,
      userType: payload.userType,
      sessionId: payload.sessionId
    }, "15m"); // 15 minutes expiration

    // In refreshSessionController, update the refresh token generation:
    const newRefreshToken = JWTUtils.sign({
    userId: payload.userId,
    walletAddress: payload.walletAddress,    // Add required field
    userType: payload.userType,              // Add required field  
    sessionId: payload.sessionId
    }, "7d"); // 7 days expiration

    // Refresh session in database
    const updatedSession = await SessionService.refreshSession(
      session.id,
      newAccessToken,
      newRefreshToken
    );

    return res.json({
      success: true,
      data: {
        accessToken: updatedSession.token,
        refreshToken: updatedSession.refreshToken
      }
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message || "Invalid refresh token"
    });
  }
}

export async function logoutController(req: Request, res: Response) {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization header required"
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    // Find session and invalidate it
    const session = await SessionService.findByToken(token);
    if (session) {
      await SessionService.invalidateSession(session.id);
    }

    return res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Logout failed"
    });
  }
}

export async function logoutAllController(req: Request, res: Response) {
  try {
    //user info attached to req by auth middleware
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const count = await SessionService.invalidateAllUserSessions(userId);

    return res.json({
      success: true,
      message: `Logged out from ${count} devices`
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to logout from all devices"
    });
  }
}
