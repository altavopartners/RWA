/*
  Warnings:

  - You are about to drop the column `cartId` on the `CartItem` table. All the data in the column will be lost.
  - You are about to drop the column `cartId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Cart` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_userId_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_cartId_fkey";

-- DropIndex
DROP INDEX "ux_cartitem_cart_product";

-- AlterTable
ALTER TABLE "CartItem" DROP COLUMN "cartId",
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "cartId";

-- DropTable
DROP TABLE "Cart";

-- DropEnum
DROP TYPE "CartStatus";
