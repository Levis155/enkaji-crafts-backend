/*
  Warnings:

  - Made the column `county` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `town` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "county" SET NOT NULL,
ALTER COLUMN "county" SET DEFAULT 'Nairobi',
ALTER COLUMN "town" SET NOT NULL,
ALTER COLUMN "town" SET DEFAULT 'CBD';
