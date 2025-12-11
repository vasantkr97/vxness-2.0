/*
  Warnings:

  - You are about to alter the column `balance_raw` on the `assets` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "assets" ALTER COLUMN "balance_raw" SET DATA TYPE INTEGER;
