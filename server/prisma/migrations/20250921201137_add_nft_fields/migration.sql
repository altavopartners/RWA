-- CreateEnum
CREATE TYPE "NFTStatus" AS ENUM ('PENDING', 'MINTED', 'FAILED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "hederaSerials" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "hederaTokenId" TEXT,
ADD COLUMN     "nftStatus" "NFTStatus" NOT NULL DEFAULT 'PENDING';
