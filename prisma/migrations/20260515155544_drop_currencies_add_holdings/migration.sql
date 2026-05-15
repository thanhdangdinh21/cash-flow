/*
  Warnings:

  - You are about to drop the column `total_cost` on the `account_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `total_quantity` on the `account_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `is_commodity` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `unit_name` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the `currencies` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_currency_code_fkey";

-- AlterTable
ALTER TABLE "account_snapshots" DROP COLUMN "total_cost",
DROP COLUMN "total_quantity";

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "is_commodity",
DROP COLUMN "unit_name";

-- AlterTable
ALTER TABLE "journal_entries" ADD COLUMN     "holding_id" TEXT;

-- DropTable
DROP TABLE "currencies";

-- CreateTable
CREATE TABLE "holdings" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit_name" TEXT NOT NULL,
    "current_quantity" DECIMAL(18,8) NOT NULL DEFAULT 0,
    "current_cost" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holdings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "holdings" ADD CONSTRAINT "holdings_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_holding_id_fkey" FOREIGN KEY ("holding_id") REFERENCES "holdings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
