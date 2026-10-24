-- DropIndex
DROP INDEX "company_profile_adminId_idx";

-- DropIndex
DROP INDEX "document_sequences_documentType_year_key";

-- DropIndex
DROP INDEX "gst_invoice_settings_adminId_idx";

-- DropIndex
DROP INDEX "hsn_master_code_key";

-- DropIndex
DROP INDEX "lead_status_masters_code_key";

-- DropIndex
DROP INDEX "lead_status_masters_normalizedName_key";

-- DropIndex
DROP INDEX "non_gst_invoice_settings_adminId_idx";

-- DropIndex
DROP INDEX "product_masters_normalizedName_key";

-- DropIndex
DROP INDEX "sales_documents_documentNo_key";

-- DropIndex
DROP INDEX "sales_documents_requestKey_key";

-- DropIndex
DROP INDEX "service_masters_normalizedName_key";

-- DropIndex
DROP INDEX "staff_members_employeeCode_key";

-- AlterTable
ALTER TABLE "brochure_masters" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "calendar_events" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "company_profile" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "crm_notifications" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "customers" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "document_sequences" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "gst_invoice_settings" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "hsn_master" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "invoice_payments" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "lead_followups" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "lead_history" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "lead_meetings" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "lead_reminders" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "lead_status_masters" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "leads" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "leave_requests" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "non_gst_invoice_settings" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "notes" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "payment_method_masters" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "product_masters" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "sales_documents" ALTER COLUMN "bankAccountNo" SET DEFAULT '',
ALTER COLUMN "bankIfsc" SET DEFAULT '',
ALTER COLUMN "bankName" SET DEFAULT '',
ALTER COLUMN "signatoryName" SET DEFAULT '',
ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "service_masters" ALTER COLUMN "adminId" SET NOT NULL;

-- AlterTable
ALTER TABLE "staff_members" ALTER COLUMN "adminId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "company_profile_adminId_key" ON "company_profile"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "document_sequences_adminId_documentType_year_key" ON "document_sequences"("adminId", "documentType", "year");

-- CreateIndex
CREATE UNIQUE INDEX "gst_invoice_settings_adminId_key" ON "gst_invoice_settings"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "hsn_master_adminId_code_key" ON "hsn_master"("adminId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "lead_status_masters_adminId_normalizedName_key" ON "lead_status_masters"("adminId", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "lead_status_masters_adminId_code_key" ON "lead_status_masters"("adminId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "non_gst_invoice_settings_adminId_key" ON "non_gst_invoice_settings"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "product_masters_adminId_normalizedName_key" ON "product_masters"("adminId", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "sales_documents_adminId_documentNo_key" ON "sales_documents"("adminId", "documentNo");

-- CreateIndex
CREATE UNIQUE INDEX "sales_documents_adminId_requestKey_key" ON "sales_documents"("adminId", "requestKey");

-- CreateIndex
CREATE UNIQUE INDEX "service_masters_adminId_normalizedName_key" ON "service_masters"("adminId", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "staff_members_adminId_employeeCode_key" ON "staff_members"("adminId", "employeeCode");
