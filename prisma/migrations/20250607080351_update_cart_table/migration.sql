/*
  Warnings:

  - Made the column `original_price` on table `cart` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "cart" ALTER COLUMN "quantity" DROP DEFAULT,
ALTER COLUMN "in_stock" DROP DEFAULT,
ALTER COLUMN "original_price" SET NOT NULL;
