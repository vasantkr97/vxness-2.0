/*
  Warnings:

  - The values [TAKE_PROFIT,STOP_LOSS,MANUAL,LIQUIDATION] on the enum `close_reason` will be removed. If these variants are still used in the database, this will fail.
  - The values [LONG,SHORT] on the enum `order_side` will be removed. If these variants are still used in the database, this will fail.
  - The values [OPEN,CLOSED] on the enum `order_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "close_reason_new" AS ENUM ('take_profit', 'stop_loss', 'manual', 'liquidation');
ALTER TABLE "orders" ALTER COLUMN "close_reason" TYPE "close_reason_new" USING ("close_reason"::text::"close_reason_new");
ALTER TYPE "close_reason" RENAME TO "close_reason_old";
ALTER TYPE "close_reason_new" RENAME TO "close_reason";
DROP TYPE "public"."close_reason_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "order_side_new" AS ENUM ('long', 'short');
ALTER TABLE "orders" ALTER COLUMN "side" TYPE "order_side_new" USING ("side"::text::"order_side_new");
ALTER TYPE "order_side" RENAME TO "order_side_old";
ALTER TYPE "order_side_new" RENAME TO "order_side";
DROP TYPE "public"."order_side_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "order_status_new" AS ENUM ('open', 'closed');
ALTER TABLE "public"."orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "order_status_new" USING ("status"::text::"order_status_new");
ALTER TYPE "order_status" RENAME TO "order_status_old";
ALTER TYPE "order_status_new" RENAME TO "order_status";
DROP TYPE "public"."order_status_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'open';
COMMIT;

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'open';
