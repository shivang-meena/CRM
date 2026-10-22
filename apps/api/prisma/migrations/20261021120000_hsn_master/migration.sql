CREATE TABLE "hsn_master" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "igstRate" DECIMAL(5,2) NOT NULL,
    "sgstRate" DECIMAL(5,2) NOT NULL,
    "cgstRate" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hsn_master_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hsn_master_rates_check" CHECK (
        "igstRate" BETWEEN 0 AND 100 AND "sgstRate" BETWEEN 0 AND 100
        AND "cgstRate" BETWEEN 0 AND 100 AND "sgstRate" + "cgstRate" <= 100
        AND "igstRate" = "sgstRate" + "cgstRate"
    )
);
CREATE UNIQUE INDEX "hsn_master_code_key" ON "hsn_master"("code");

ALTER TABLE "sales_document_items"
    ADD COLUMN "hsnMasterId" TEXT,
    ADD COLUMN "hsnDescription" TEXT;
