/*
  Warnings:

  - A unique constraint covering the columns `[hederaTokenId]` on the table `OrderedItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hederaTokenId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Made the column `hederaTokenId` on table `OrderedItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `hederaTokenId` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "OrderedItem" ALTER COLUMN "hederaTokenId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "hederaTokenId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "OrderedItem_hederaTokenId_key" ON "OrderedItem"("hederaTokenId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_hederaTokenId_key" ON "Product"("hederaTokenId");
