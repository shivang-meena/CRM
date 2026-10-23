CREATE TABLE "product_masters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "hsnSac" TEXT NOT NULL DEFAULT '',
    "description" TEXT DEFAULT '',
    "igstRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "sgstRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "cgstRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_masters_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_masters_normalizedName_key" ON "product_masters"("normalizedName");
