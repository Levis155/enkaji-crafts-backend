/*
  Warnings:

  - You are about to drop the column `county` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `email_address` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `phone_number` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `town` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "county",
DROP COLUMN "email_address",
DROP COLUMN "phone_number",
DROP COLUMN "town";
