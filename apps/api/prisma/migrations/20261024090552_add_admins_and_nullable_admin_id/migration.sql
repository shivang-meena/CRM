-- CreateEnum
CREATE TYPE "AdminStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- AlterTable
ALTER TABLE "brochure_masters" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "calendar_events" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "company_profile" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "crm_notifications" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "document_sequences" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "gst_invoice_settings" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "hsn_master" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "invoice_payments" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "lead_followups" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "lead_history" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "lead_meetings" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "lead_reminders" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "lead_status_masters" ADD COLUMN     "adminId" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "non_gst_invoice_settings" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "payment_method_masters" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "product_masters" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "sales_documents" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "service_masters" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "staff_members" ADD COLUMN     "adminId" TEXT;

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "loginId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessName" TEXT NOT NULL DEFAULT '',
    "phone" TEXT,
    "email" TEXT,
    "status" "AdminStatus" NOT NULL DEFAULT 'ACTIVE',
    "blockedAt" TIMESTAMPTZ(3),
    "featLead" BOOLEAN NOT NULL DEFAULT true,
    "featReminder" BOOLEAN NOT NULL DEFAULT true,
    "featMeeting" BOOLEAN NOT NULL DEFAULT true,
    "featNote" BOOLEAN NOT NULL DEFAULT true,
    "featCalendar" BOOLEAN NOT NULL DEFAULT true,
    "featCustomer" BOOLEAN NOT NULL DEFAULT true,
    "featInvoice" BOOLEAN NOT NULL DEFAULT true,
    "featStaff" BOOLEAN NOT NULL DEFAULT true,
    "featLeave" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_loginId_key" ON "admins"("loginId");

-- CreateIndex
CREATE INDEX "admins_status_deletedAt_idx" ON "admins"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "brochure_masters_adminId_idx" ON "brochure_masters"("adminId");

-- CreateIndex
CREATE INDEX "calendar_events_adminId_idx" ON "calendar_events"("adminId");

-- CreateIndex
CREATE INDEX "company_profile_adminId_idx" ON "company_profile"("adminId");

-- CreateIndex
CREATE INDEX "crm_notifications_adminId_idx" ON "crm_notifications"("adminId");

-- CreateIndex
CREATE INDEX "customers_adminId_idx" ON "customers"("adminId");

-- CreateIndex
CREATE INDEX "document_sequences_adminId_idx" ON "document_sequences"("adminId");

-- CreateIndex
CREATE INDEX "gst_invoice_settings_adminId_idx" ON "gst_invoice_settings"("adminId");

-- CreateIndex
CREATE INDEX "hsn_master_adminId_idx" ON "hsn_master"("adminId");

-- CreateIndex
CREATE INDEX "invoice_payments_adminId_idx" ON "invoice_payments"("adminId");

-- CreateIndex
CREATE INDEX "lead_followups_adminId_idx" ON "lead_followups"("adminId");

-- CreateIndex
CREATE INDEX "lead_history_adminId_idx" ON "lead_history"("adminId");

-- CreateIndex
CREATE INDEX "lead_meetings_adminId_idx" ON "lead_meetings"("adminId");

-- CreateIndex
CREATE INDEX "lead_reminders_adminId_idx" ON "lead_reminders"("adminId");

-- CreateIndex
CREATE INDEX "lead_status_masters_adminId_idx" ON "lead_status_masters"("adminId");

-- CreateIndex
CREATE INDEX "leads_adminId_idx" ON "leads"("adminId");

-- CreateIndex
CREATE INDEX "leave_requests_adminId_idx" ON "leave_requests"("adminId");

-- CreateIndex
CREATE INDEX "non_gst_invoice_settings_adminId_idx" ON "non_gst_invoice_settings"("adminId");

-- CreateIndex
CREATE INDEX "notes_adminId_idx" ON "notes"("adminId");

-- CreateIndex
CREATE INDEX "payment_method_masters_adminId_idx" ON "payment_method_masters"("adminId");

-- CreateIndex
CREATE INDEX "product_masters_adminId_idx" ON "product_masters"("adminId");

-- CreateIndex
CREATE INDEX "sales_documents_adminId_idx" ON "sales_documents"("adminId");

-- CreateIndex
CREATE INDEX "service_masters_adminId_idx" ON "service_masters"("adminId");

-- CreateIndex
CREATE INDEX "staff_members_adminId_idx" ON "staff_members"("adminId");
