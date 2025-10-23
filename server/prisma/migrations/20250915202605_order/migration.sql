/*
  Warnings:

  - The primary key for the `Order` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `code` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `seq` on the `Order` table. All the data in the column will be lost.
  - The `id` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `orderId` on the `OrderedItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "OrderedItem" DROP CONSTRAINT "OrderedItem_orderId_fkey";

-- DropIndex
DROP INDEX "Order_code_key";

-- DropIndex
DROP INDEX "Order_seq_key";

-- AlterTable
ALTER TABLE "Order" DROP CONSTRAINT "Order_pkey",
DROP COLUMN "code",
DROP COLUMN "seq",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Order_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "OrderedItem" DROP COLUMN "orderId",
ADD COLUMN     "orderId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "OrderedItem_orderId_idx" ON "OrderedItem"("orderId");

-- AddForeignKey
ALTER TABLE "OrderedItem" ADD CONSTRAINT "OrderedItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
