/*
  Warnings:

  - You are about to drop the column `product_id` on the `cart` table. All the data in the column will be lost.
  - Added the required column `image_url` to the `cart` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_name` to the `cart` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_price` to the `cart` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "cart" DROP CONSTRAINT "cart_product_id_fkey";

-- AlterTable
ALTER TABLE "cart" DROP COLUMN "product_id",
ADD COLUMN     "image_url" TEXT NOT NULL,
ADD COLUMN     "in_stock" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "original_price" DOUBLE PRECISION,
ADD COLUMN     "product_name" TEXT NOT NULL,
ADD COLUMN     "product_price" DOUBLE PRECISION NOT NULL;
