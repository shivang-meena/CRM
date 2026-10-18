/*
  Warnings:

  - You are about to drop the column `description` on the `sales_document_items` table. All the data in the column will be lost.
  - You are about to drop the column `documentId` on the `sales_document_items` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `sales_document_items` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `sales_document_items` table. All the data in the column will be lost.
  - You are about to alter the column `quantity` on the `sales_document_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,3)` to `Integer`.
  - You are about to alter the column `unitPrice` on the `sales_document_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(14,2)` to `Decimal(12,2)`.
  - You are about to alter the column `discountAmount` on the `sales_document_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(16,2)` to `Decimal(12,2)`.
  - You are about to alter the column `grossAmount` on the `sales_document_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(16,2)` to `Decimal(12,2)`.
  - You are about to alter the column `netAmount` on the `sales_document_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(16,2)` to `Decimal(12,2)`.
  - You are about to alter the column `taxAmount` on the `sales_document_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(16,2)` to `Decimal(12,2)`.
  - You are about to alter the column `totalAmount` on the `sales_document_items` table. The data in that column could be lost. The data in that column will be cast from `Decimal(16,2)` to `Decimal(12,2)`.
  - You are about to drop the column `customerSnapshot` on the `sales_documents` table. All the data in the column will be lost.
  - You are about to drop the column `documentDate` on the `sales_documents` table. All the data in the column will be lost.
  - You are about to drop the column `documentNumber` on the `sales_documents` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `sales_documents` table. All the data in the column will be lost.
  - You are about to drop the column `finalizedAt` on the `sales_documents` table. All the data in the column will be lost.
  - You are about to drop the column `issuerSnapshot` on the `sales_documents` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `sales_documents` table. All the data in the column will be lost.
  - You are about to drop the column `requestHash` on the `sales_documents` table. All the data in the column will be lost.
  - You are about to drop the column `terms` on the `sales_documents` table. All the data in the column will be lost.
  - You are about to drop the column `updatedById` on the `sales_documents` table. All the data in the column will be lost.
  - You are about to drop the column `updatedByName` on the `sales_documents` table. All the data in the column will be lost.
  - You are about to drop the column `validUntil` on the `sales_documents` table. All the data in the column will be lost.
  - The `type` column on the `sales_documents` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `sales_documents` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `subtotal` on the `sales_documents` table. The data in that column could be lost. The data in that column will be cast from `Decimal(16,2)` to `Decimal(12,2)`.
  - You are about to alter the column `discountTotal` on the `sales_documents` table. The data in that column could be lost. The data in that column will be cast from `Decimal(16,2)` to `Decimal(12,2)`.
  - You are about to alter the column `taxTotal` on the `sales_documents` table. The data in that column could be lost. The data in that column will be cast from `Decimal(16,2)` to `Decimal(12,2)`.
  - You are about to alter the column `grandTotal` on the `sales_documents` table. The data in that column could be lost. The data in that column will be cast from `Decimal(16,2)` to `Decimal(12,2)`.
  - A unique constraint covering the columns `[documentNo]` on the table `sales_documents` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sourceQuotationId]` on the table `sales_documents` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[requestKey]` on the table `sales_documents` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productName` to the `sales_document_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salesDocumentId` to the `sales_document_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `sales_documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `documentNo` to the `sales_documents` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SalesDocumentType" AS ENUM ('QUOTATION', 'INVOICE');

-- CreateEnum
CREATE TYPE "SalesDocumentStatus" AS ENUM ('DRAFT', 'FINALIZED', 'ACCEPTED', 'REJECTED', 'ISSUED', 'VOID');

-- CreateEnum
CREATE TYPE "GstMode" AS ENUM ('NON_GST', 'IGST', 'SGST_CGST');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('FIXED', 'OVERALL', 'PERCENTAGE', 'FLAT_PER_UNIT');

-- CreateEnum
CREATE TYPE "InvoicePaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'HALF_PAID', 'PAID');

-- DropForeignKey
ALTER TABLE "sales_document_items" DROP CONSTRAINT "sales_document_items_documentId_fkey";

-- DropForeignKey
ALTER TABLE "sales_documents" DROP CONSTRAINT "sales_documents_leadId_fkey";

-- DropForeignKey
ALTER TABLE "sales_documents" DROP CONSTRAINT "sales_documents_sourceQuotationId_fkey";

-- Drop constraints
ALTER TABLE "sales_documents" DROP CONSTRAINT IF EXISTS "sales_documents_documentNumber_key";
ALTER TABLE "sales_documents" DROP CONSTRAINT IF EXISTS "document_valid_status";
ALTER TABLE "sales_document_items" DROP CONSTRAINT IF EXISTS "item_positive_values";

-- DropIndex
DROP INDEX IF EXISTS "sales_document_items_documentId_position_key";
DROP INDEX IF EXISTS "sales_documents_createdById_requestKey_key";
DROP INDEX IF EXISTS "one_active_invoice_per_quote";
DROP INDEX IF EXISTS "sales_documents_leadId_type_deletedAt_createdAt_idx";
DROP INDEX IF EXISTS "sales_documents_type_status_documentDate_idx";

-- AlterTable
ALTER TABLE "calendar_events" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deletedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "sales_document_items" DROP COLUMN "description",
DROP COLUMN "documentId",
DROP COLUMN "position",
DROP COLUMN "unit",
ADD COLUMN     "cgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "cgstRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "comments" TEXT,
ADD COLUMN     "discountType" "DiscountType" NOT NULL DEFAULT 'FIXED',
ADD COLUMN     "discountValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "hsnSac" TEXT,
ADD COLUMN     "igstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "igstRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "productName" TEXT NOT NULL,
ADD COLUMN     "salesDocumentId" TEXT NOT NULL,
ADD COLUMN     "sgstAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "sgstRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "quantity" SET DEFAULT 1,
ALTER COLUMN "quantity" SET DATA TYPE INTEGER,
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "discountAmount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "grossAmount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "netAmount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "taxAmount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "sales_documents" DROP COLUMN "customerSnapshot",
DROP COLUMN "documentDate",
DROP COLUMN "documentNumber",
DROP COLUMN "dueDate",
DROP COLUMN "finalizedAt",
DROP COLUMN "issuerSnapshot",
DROP COLUMN "notes",
DROP COLUMN "requestHash",
DROP COLUMN "terms",
DROP COLUMN "updatedById",
DROP COLUMN "updatedByName",
DROP COLUMN "validUntil",
ADD COLUMN     "bankAccountNo" TEXT NOT NULL DEFAULT '50200103608173',
ADD COLUMN     "bankIfsc" TEXT NOT NULL DEFAULT 'HDFC0009621',
ADD COLUMN     "bankName" TEXT NOT NULL DEFAULT 'HDFC Bank',
ADD COLUMN     "brochureId" TEXT,
ADD COLUMN     "cgstTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "companyNameSnapshot" TEXT,
ADD COLUMN     "customerAddressSnapshot" TEXT,
ADD COLUMN     "customerEmailSnapshot" TEXT,
ADD COLUMN     "customerGstinSnapshot" TEXT,
ADD COLUMN     "customerId" TEXT NOT NULL,
ADD COLUMN     "customerNameSnapshot" TEXT,
ADD COLUMN     "customerPhoneSnapshot" TEXT,
ADD COLUMN     "documentNo" TEXT NOT NULL,
ADD COLUMN     "dueAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "emailAutomation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "grossSubtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "gstMode" "GstMode" NOT NULL DEFAULT 'NON_GST',
ADD COLUMN     "igstTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "inclusiveGst" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "nextPaymentDate" TIMESTAMP(3),
ADD COLUMN     "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "paymentMethodId" TEXT,
ADD COLUMN     "paymentStatus" "InvoicePaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "sellerAddress" TEXT NOT NULL DEFAULT 'RISE Jhansi Incubation Center, Jhansi Nagar Nigam Premises, Near Elite Chauraha, Civil Lines',
ADD COLUMN     "sellerCompanyName" TEXT NOT NULL DEFAULT 'CRAZYWEBDEV TECHNOLOGIES',
ADD COLUMN     "sellerEmail" TEXT NOT NULL DEFAULT 'contact@crazywebdev.com',
ADD COLUMN     "sellerPhone" TEXT NOT NULL DEFAULT '918081048515',
ADD COLUMN     "sgstTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "signatoryName" TEXT NOT NULL DEFAULT 'Vishwajeet',
ADD COLUMN     "termsAndConditions" TEXT,
ADD COLUMN     "whatsappAutomation" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "leadId" DROP NOT NULL,
ALTER COLUMN "createdById" DROP NOT NULL,
ALTER COLUMN "createdByName" SET DEFAULT 'System User',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deletedAt" SET DATA TYPE TIMESTAMP(3),
DROP COLUMN "type",
ADD COLUMN     "type" "SalesDocumentType" NOT NULL DEFAULT 'INVOICE',
DROP COLUMN "status",
ADD COLUMN     "status" "SalesDocumentStatus" NOT NULL DEFAULT 'ISSUED',
ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "discountTotal" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "taxTotal" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "grandTotal" SET DATA TYPE DECIMAL(12,2);

-- CreateTable
CREATE TABLE "payment_method_masters" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "bankName" TEXT,
    "accountNo" TEXT,
    "ifscCode" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_method_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brochure_masters" (
    "id" TEXT NOT NULL,
    "brochureName" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PDF',
    "startAfter" TEXT NOT NULL DEFAULT 'Immediate',
    "fileUrl" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brochure_masters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sales_document_items_salesDocumentId_idx" ON "sales_document_items"("salesDocumentId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_documents_documentNo_key" ON "sales_documents"("documentNo");

-- CreateIndex
CREATE UNIQUE INDEX "sales_documents_sourceQuotationId_key" ON "sales_documents"("sourceQuotationId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_documents_requestKey_key" ON "sales_documents"("requestKey");

-- CreateIndex
CREATE INDEX "sales_documents_type_deletedAt_issueDate_idx" ON "sales_documents"("type", "deletedAt", "issueDate");

-- CreateIndex
CREATE INDEX "sales_documents_customerId_idx" ON "sales_documents"("customerId");

-- AddForeignKey
ALTER TABLE "sales_documents" ADD CONSTRAINT "sales_documents_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_documents" ADD CONSTRAINT "sales_documents_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_documents" ADD CONSTRAINT "sales_documents_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method_masters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_documents" ADD CONSTRAINT "sales_documents_brochureId_fkey" FOREIGN KEY ("brochureId") REFERENCES "brochure_masters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_document_items" ADD CONSTRAINT "sales_document_items_salesDocumentId_fkey" FOREIGN KEY ("salesDocumentId") REFERENCES "sales_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
