-- CreateEnum
CREATE TYPE "symbol" AS ENUM ('USDC', 'BTC', 'SOL', 'ETH');

-- CreateEnum
CREATE TYPE "order_side" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "order_status" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "close_reason" AS ENUM ('TAKE_PROFIT', 'STOP_LOSS', 'MANUAL', 'LIQUIDATION');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "symbol" "symbol" NOT NULL,
    "balance_raw" INTEGER NOT NULL,
    "balance_decimals" INTEGER NOT NULL DEFAULT 8,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "symbol" "symbol" NOT NULL,
    "side" "order_side" NOT NULL,
    "status" "order_status" NOT NULL DEFAULT 'OPEN',
    "quantity" INTEGER NOT NULL,
    "quantity_decimals" INTEGER NOT NULL DEFAULT 2,
    "open_price" INTEGER NOT NULL,
    "close_price" INTEGER,
    "price_decimals" INTEGER NOT NULL DEFAULT 2,
    "leverage" INTEGER NOT NULL DEFAULT 1,
    "margin_required" INTEGER NOT NULL,
    "take_profit_price" INTEGER,
    "stop_loss_price" INTEGER,
    "realized_pnl" INTEGER,
    "close_reason" "close_reason",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "assets_symbol_idx" ON "assets"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "assets_user_id_symbol_key" ON "assets"("user_id", "symbol");

-- CreateIndex
CREATE INDEX "orders_user_id_status_idx" ON "orders"("user_id", "status");

-- CreateIndex
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "orders_symbol_status_idx" ON "orders"("symbol", "status");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
