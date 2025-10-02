// src/services/profile.service.ts
// Encapsulates logic for retrieving and updating user profile information.
// Interacts directly with the Prisma database client to fetch/update user data in the `User` table.
// Provides a clean separation for profile-related database operations.
 //Small layer for profile get/update. Used by profile controller.
import { prisma } from "../utils/prisma";

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      walletAddress: true,
      fullName:true,
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
  if (!user) throw new Error("User not found");
  return user;
};

export const updateProfile = async (userId: string, data: Partial<{ fullName: string; email: string; phoneNumber: string; location: string; profileImage: string; businessName: string; businessDesc: string; }>) => {
  // Basic uniqueness checks omitted here - rely on auth.service for core identity
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { ...data, updatedAt: new Date() },
  });
  return updated;
};
