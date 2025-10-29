"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNonceController = generateNonceController;
exports.connectWalletController = connectWalletController;
exports.getProfileController = getProfileController;
exports.updateProfileController = updateProfileController;
exports.getIdentityController = getIdentityController;
const auth_service_1 = require("../services/auth.service");
/** POST /api/auth/nonce */
async function generateNonceController(req, res) {
    try {
        const { walletAddress } = req.body;
        if (!walletAddress)
            return res
                .status(400)
                .json({ success: false, message: "walletAddress required" });
        const result = await (0, auth_service_1.generateWalletNonce)(walletAddress);
        return res.json({ success: true, data: result });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
/** POST /api/auth/connect */
async function connectWalletController(req, res) {
    try {
        const { walletAddress, signature, message, nonce, walletType, publicKeyHex, } = req.body;
        if (!walletAddress || !signature || !message || !nonce || !walletType) {
            return res
                .status(400)
                .json({ success: false, message: "missing params" });
        }
        const { accessToken, refreshToken, user } = await (0, auth_service_1.connectWalletService)({
            walletAddress,
            signature,
            message,
            nonce,
            walletType,
            publicKeyHex,
            ipAddress: req.ip,
            userAgent: req.get("User-Agent") || undefined,
        });
        return res.json({
            success: true,
            accessToken,
            refreshToken,
            user,
        });
    }
    catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
}
/** GET /api/auth/profile */
async function getProfileController(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: "Unauthorized" });
        const profile = await (0, auth_service_1.getUserProfile)(req.user.id);
        return res.json({ success: true, data: profile });
    }
    catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
}
/** PUT /api/auth/profile (unified profile update) */
async function updateProfileController(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ success: false, message: "Unauthorized" });
        console.log("🔴 Backend received:", req.body);
        // Extract only the fields we want to update (filter out undefined values)
        const updateData = {};
        // Core identity fields
        if (req.body.fullName !== undefined)
            updateData.fullName = req.body.fullName;
        if (req.body.email !== undefined)
            updateData.email = req.body.email;
        if (req.body.phoneNumber !== undefined)
            updateData.phoneNumber = req.body.phoneNumber;
        if (req.body.location !== undefined)
            updateData.location = req.body.location;
        if (req.body.profileImage !== undefined)
            updateData.profileImage = req.body.profileImage;
        if (req.body.businessName !== undefined)
            updateData.businessName = req.body.businessName;
        if (req.body.businessDesc !== undefined)
            updateData.businessDesc = req.body.businessDesc;
        console.log("🟣 Backend updating with:", updateData);
        // Use the unified function
        const updatedProfile = await (0, auth_service_1.updateUserProfile)(req.user.id, updateData);
        console.log("🟢 Backend result:", updatedProfile);
        return res.json({ success: true, data: updatedProfile });
    }
    catch (err) {
        console.error("❌ Profile update error:", err);
        return res.status(400).json({ success: false, message: err.message });
    }
}
/** GET /api/auth/identity/:walletAddress */
async function getIdentityController(req, res) {
    try {
        const { walletAddress } = req.params;
        if (!walletAddress)
            return res
                .status(400)
                .json({ success: false, message: "Wallet address is required" });
        const identity = await (0, auth_service_1.getIdentityByWallet)(walletAddress);
        return res.json({ success: true, data: identity });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
//# sourceMappingURL=auth.controller.js.map