-- AlterTable
ALTER TABLE "service_masters"
    ADD COLUMN "hsnSac" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "description" TEXT DEFAULT '',
    ADD COLUMN "igstRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    ADD COLUMN "sgstRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    ADD COLUMN "cgstRate" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "leads"
    ADD COLUMN "state" TEXT;

-- AlterTable
ALTER TABLE "sales_documents"
    ADD COLUMN "customerStateSnapshot" TEXT;
