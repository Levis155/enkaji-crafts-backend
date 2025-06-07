/*
  Warnings:

  - A unique constraint covering the columns `[product_name]` on the table `cart` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "cart_product_name_key" ON "cart"("product_name");
