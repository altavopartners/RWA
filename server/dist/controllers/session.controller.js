"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshSessionController = refreshSessionController;
exports.logoutController = logoutController;
exports.logoutAllController = logoutAllController;
const session_service_1 = require("../services/session.service");
const jwt_1 = require("../utils/jwt"); // Import JWTUtils instead of verifyToken
async function refreshSessionController(req, res) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required"
            });
        }
        // Find session by refresh token
        const session = await session_service_1.SessionService.findByRefreshToken(refreshToken);
        if (!session) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }
        // Verify the refresh token is valid
        try {
            jwt_1.JWTUtils.verify(refreshToken);
        }
        catch (error) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }
        // Extract payload from refresh token to create new tokens
        const payload = jwt_1.JWTUtils.decode(refreshToken);
        if (!payload) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token payload"
            });
        }
        // Generate new tokens using JWTUtils
        const newAccessToken = jwt_1.JWTUtils.sign({
            userId: payload.userId,
            walletAddress: payload.walletAddress,
            userType: payload.userType,
            sessionId: payload.sessionId
        }, "15m"); // 15 minutes expiration
        // In refreshSessionController, update the refresh token generation:
        const newRefreshToken = jwt_1.JWTUtils.sign({
            userId: payload.userId,
            walletAddress: payload.walletAddress, // Add required field
            userType: payload.userType, // Add required field  
            sessionId: payload.sessionId
        }, "7d"); // 7 days expiration
        // Refresh session in database
        const updatedSession = await session_service_1.SessionService.refreshSession(session.id, newAccessToken, newRefreshToken);
        return res.json({
            success: true,
            data: {
                accessToken: updatedSession.token,
                refreshToken: updatedSession.refreshToken
            }
        });
    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message || "Invalid refresh token"
        });
    }
}
async function logoutController(req, res) {
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
        const session = await session_service_1.SessionService.findByToken(token);
        if (session) {
            await session_service_1.SessionService.invalidateSession(session.id);
        }
        return res.json({
            success: true,
            message: "Logged out successfully"
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Logout failed"
        });
    }
}
async function logoutAllController(req, res) {
    try {
        //user info attached to req by auth middleware
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }
        const count = await session_service_1.SessionService.invalidateAllUserSessions(userId);
        return res.json({
            success: true,
            message: `Logged out from ${count} devices`
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to logout from all devices"
        });
    }
}
//# sourceMappingURL=session.controller.js.map