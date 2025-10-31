-- DropForeignKey
ALTER TABLE "BankReview" DROP CONSTRAINT "BankReview_bankId_fkey";

-- AlterTable
ALTER TABLE "BankReview" ALTER COLUMN "bankId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "BankReview" ADD CONSTRAINT "BankReview_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE SET NULL ON UPDATE CASCADE;
