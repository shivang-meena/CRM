CREATE TABLE "service_masters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "service_masters_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "service_masters_normalizedName_key" ON "service_masters"("normalizedName");
ALTER TABLE "leads" ADD COLUMN "serviceId" TEXT;
CREATE INDEX "leads_serviceId_idx" ON "leads"("serviceId");
ALTER TABLE "leads" ADD CONSTRAINT "leads_serviceId_fkey"
    FOREIGN KEY ("serviceId") REFERENCES "service_masters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
