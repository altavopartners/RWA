-- DropIndex
DROP INDEX "OrderedItem_hederaTokenId_key";

-- DropIndex
DROP INDEX "Product_hederaTokenId_key";

-- AlterTable
ALTER TABLE "OrderedItem" ALTER COLUMN "hederaTokenId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "hederaTokenId" DROP NOT NULL;
