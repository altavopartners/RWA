"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = void 0;
// src/services/profile.service.ts
// Encapsulates logic for retrieving and updating user profile information.
// Interacts directly with the Prisma database client to fetch/update user data in the `User` table.
// Provides a clean separation for profile-related database operations.
//Small layer for profile get/update. Used by profile controller.
const prisma_1 = require("../utils/prisma");
const getProfile = async (userId) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            walletAddress: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            location: true,
            profileImage: true,
            businessName: true,
            businessDesc: true,
            userType: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    if (!user)
        throw new Error("User not found");
    return user;
};
exports.getProfile = getProfile;
const updateProfile = async (userId, data) => {
    // Basic uniqueness checks omitted here - rely on auth.service for core identity
    const updated = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { ...data, updatedAt: new Date() },
    });
    return updated;
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=profile.service.js.map