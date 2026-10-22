-- CreateTable
CREATE TABLE "lead_status_masters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "code" TEXT,
    "color" TEXT NOT NULL DEFAULT '#0284c7',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_status_masters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lead_status_masters_normalizedName_key" ON "lead_status_masters"("normalizedName");
CREATE UNIQUE INDEX "lead_status_masters_code_key" ON "lead_status_masters"("code");

-- AlterTable Lead status enum to text
ALTER TABLE "leads" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "leads" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'NEW';

-- Seed default statuses
INSERT INTO "lead_status_masters" ("id", "name", "normalizedName", "code", "color", "order", "isActive", "createdAt", "updatedAt")
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'New', 'new', 'NEW', '#0284C7', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c1000000-0000-0000-0000-000000000002', 'Processing', 'processing', 'PROCESSING', '#7C3AED', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c1000000-0000-0000-0000-000000000003', 'Close-by', 'close-by', 'CLOSE_BY', '#65A30D', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c1000000-0000-0000-0000-000000000004', 'Confirm', 'confirm', 'CONFIRM', '#16A34A', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('c1000000-0000-0000-0000-000000000005', 'Cancel', 'cancel', 'CANCEL', '#DC2626', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("normalizedName") DO NOTHING;
