-- AlterEnum
ALTER TYPE "UserType" ADD VALUE 'USER';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "userType" SET DEFAULT 'USER';
