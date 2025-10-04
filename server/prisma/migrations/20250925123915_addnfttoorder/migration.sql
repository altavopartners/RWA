-- AlterTable
ALTER TABLE "OrderedItem" ADD COLUMN     "hederaSerials" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "hederaTokenId" TEXT,
ADD COLUMN     "nftStatus" "NFTStatus" NOT NULL DEFAULT 'PENDING';
