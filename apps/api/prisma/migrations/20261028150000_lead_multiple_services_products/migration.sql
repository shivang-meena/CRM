CREATE TABLE "lead_service_selections" (
    "adminId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "lead_service_selections_pkey" PRIMARY KEY ("leadId", "serviceId")
);

CREATE INDEX "lead_service_selections_adminId_leadId_idx" ON "lead_service_selections"("adminId", "leadId");
CREATE INDEX "lead_service_selections_serviceId_idx" ON "lead_service_selections"("serviceId");

ALTER TABLE "lead_service_selections" ADD CONSTRAINT "lead_service_selections_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_service_selections" ADD CONSTRAINT "lead_service_selections_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "service_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "lead_product_selections" (
    "adminId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "lead_product_selections_pkey" PRIMARY KEY ("leadId", "productId")
);

CREATE INDEX "lead_product_selections_adminId_leadId_idx" ON "lead_product_selections"("adminId", "leadId");
CREATE INDEX "lead_product_selections_productId_idx" ON "lead_product_selections"("productId");

ALTER TABLE "lead_product_selections" ADD CONSTRAINT "lead_product_selections_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_product_selections" ADD CONSTRAINT "lead_product_selections_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "product_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "leads" l
    LEFT JOIN "service_masters" s ON s."id" = l."serviceId"
    WHERE l."serviceId" IS NOT NULL
      AND (s."id" IS NULL OR s."adminId" <> l."adminId")
  ) THEN
    RAISE EXCEPTION 'Cannot migrate lead services: missing service or tenant mismatch';
  END IF;
END $$;

INSERT INTO "lead_service_selections" ("adminId", "leadId", "serviceId", "position")
SELECT l."adminId", l."id", l."serviceId", 0
FROM "leads" l
WHERE l."serviceId" IS NOT NULL
ON CONFLICT ("leadId", "serviceId") DO NOTHING;
