/*
  Warnings:

  - The values [PENDING_BANK_REVIEW,BUYER_DOCS_REQUESTED,BUYER_DOCS_VERIFIED,SELLER_DOCS_REQUESTED,SELLER_DOCS_VERIFIED,BANKS_APPROVED,COMPLETED] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('AWAITING_PAYMENT', 'BANK_REVIEW', 'IN_TRANSIT', 'DELIVERED', 'DISPUTED', 'CANCELLED');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'AWAITING_PAYMENT';
COMMIT;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'AWAITING_PAYMENT';
