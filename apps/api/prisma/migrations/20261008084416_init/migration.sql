-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'PROCESSING', 'CLOSE_BY', 'CONFIRM', 'CANCEL');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('CUSTOMER_REFERENCE', 'WEBSITE', 'CALL', 'WHATSAPP', 'SOCIAL_MEDIA', 'OTHER');

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "comment" TEXT,
    "reference" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "source" "LeadSource" NOT NULL DEFAULT 'CUSTOMER_REFERENCE',
    "label" TEXT,
    "estimatedAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "rating" INTEGER NOT NULL DEFAULT 0,
    "nextFollowUpAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");
