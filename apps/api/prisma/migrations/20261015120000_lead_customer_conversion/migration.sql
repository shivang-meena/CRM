CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "convertedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedById" TEXT NOT NULL,
    "convertedByName" TEXT NOT NULL,
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "customers_leadId_key" ON "customers"("leadId");
CREATE INDEX "customers_convertedAt_id_idx" ON "customers"("convertedAt", "id");

ALTER TABLE "customers"
ADD CONSTRAINT "customers_leadId_fkey"
FOREIGN KEY ("leadId") REFERENCES "leads"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
