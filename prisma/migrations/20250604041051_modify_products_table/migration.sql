/*
  Warnings:

  - Added the required column `package_content` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "products" ADD COLUMN     "package_content" TEXT NOT NULL;
