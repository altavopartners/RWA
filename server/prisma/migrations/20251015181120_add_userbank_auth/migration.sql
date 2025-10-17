/*
  Warnings:

  - You are about to drop the column `swiftCode` on the `Bank` table. All the data in the column will be lost.
  - You are about to drop the column `bankId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `kycExpiry` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `kycStatus` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `KycReview` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `Bank` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Bank` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BankAccountStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BankUserRole" AS ENUM ('BANK_USER', 'BANK_ADMIN');

-- CreateEnum
CREATE TYPE "PaymentAction" AS ENUM ('APPROVE', 'REJECT');

-- DropForeignKey
ALTER TABLE "KycReview" DROP CONSTRAINT "KycReview_userId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_bankId_fkey";

-- AlterTable
ALTER TABLE "Bank" DROP COLUMN "swiftCode",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "logo" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "bankId",
DROP COLUMN "kycExpiry",
DROP COLUMN "kycStatus";

-- DropTable
DROP TABLE "KycReview";

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "bankId" TEXT,
    "rib" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "taxIdentificationNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBank" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "BankUserRole" NOT NULL DEFAULT 'BANK_USER',
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "bankId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "UserBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAuthSession" (
    "id" TEXT NOT NULL,
    "userBankId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentApproval" (
    "id" TEXT NOT NULL,
    "paymentReleaseId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" "PaymentAction" NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankAccount_userId_idx" ON "BankAccount"("userId");

-- CreateIndex
CREATE INDEX "BankAccount_bankCode_idx" ON "BankAccount"("bankCode");

-- CreateIndex
CREATE UNIQUE INDEX "UserBank_email_key" ON "UserBank"("email");

-- CreateIndex
CREATE INDEX "PaymentApproval_paymentReleaseId_idx" ON "PaymentApproval"("paymentReleaseId");

-- CreateIndex
CREATE INDEX "PaymentApproval_actorId_idx" ON "PaymentApproval"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "Bank_code_key" ON "Bank"("code");

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBank" ADD CONSTRAINT "UserBank_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAuthSession" ADD CONSTRAINT "BankAuthSession_userBankId_fkey" FOREIGN KEY ("userBankId") REFERENCES "UserBank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentApproval" ADD CONSTRAINT "PaymentApproval_paymentReleaseId_fkey" FOREIGN KEY ("paymentReleaseId") REFERENCES "PaymentRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentApproval" ADD CONSTRAINT "PaymentApproval_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "UserBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
