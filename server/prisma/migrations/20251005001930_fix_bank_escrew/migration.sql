-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'VALIDATED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'BANK_REVIEW';
ALTER TYPE "OrderStatus" ADD VALUE 'IN_TRANSIT';
ALTER TYPE "OrderStatus" ADD VALUE 'DELIVERED';
ALTER TYPE "OrderStatus" ADD VALUE 'DISPUTED';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "fileSize" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "validatedAt" TIMESTAMP(3),
ADD COLUMN     "validatedBy" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "buyerBankApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "buyerBankId" TEXT,
ADD COLUMN     "escrowAddress" TEXT,
ADD COLUMN     "hederaTransactionId" TEXT,
ADD COLUMN     "sellerBankApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sellerBankId" TEXT,
ADD COLUMN     "shipmentTrackingId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bankId" TEXT,
ADD COLUMN     "kycExpiry" TIMESTAMP(3),
ADD COLUMN     "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "Bank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "swiftCode" TEXT,
    "country" TEXT,

    CONSTRAINT "Bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRelease" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "released" BOOLEAN NOT NULL DEFAULT false,
    "transactionId" TEXT,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "reviewer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KycReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankReview" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankReview_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerBankId_fkey" FOREIGN KEY ("buyerBankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_sellerBankId_fkey" FOREIGN KEY ("sellerBankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRelease" ADD CONSTRAINT "PaymentRelease_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycReview" ADD CONSTRAINT "KycReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankReview" ADD CONSTRAINT "BankReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankReview" ADD CONSTRAINT "BankReview_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
