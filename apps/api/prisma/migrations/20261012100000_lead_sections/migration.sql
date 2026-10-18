-- Additive migration prepared only; not applied by the implementation agent.
ALTER TABLE "leads" ADD COLUMN "deletedAt" TIMESTAMPTZ(3), ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
CREATE TYPE "FollowUpChannel" AS ENUM ('CALL', 'WHATSAPP', 'EMAIL', 'VISIT', 'OTHER');
CREATE TYPE "FollowUpStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ActivityOrigin" AS ENUM ('USER', 'LEGACY');
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "MeetingMode" AS ENUM ('ONLINE', 'PHONE', 'IN_PERSON');
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'TRIGGERED', 'DISMISSED', 'CANCELLED');
CREATE TYPE "HistoryEntity" AS ENUM ('LEAD', 'FOLLOWUP', 'TASK', 'REMINDER', 'MEETING', 'QUOTATION', 'INVOICE', 'PAYMENT');
CREATE TYPE "HistoryAction" AS ENUM ('CREATED', 'UPDATED', 'COMPLETED', 'CANCELLED', 'DELETED', 'ARCHIVED', 'TRIGGERED', 'DISMISSED', 'FINALIZED', 'ACCEPTED', 'REJECTED', 'ISSUED', 'VOIDED', 'CONVERTED', 'IMPORTED');
CREATE TYPE "DocumentType" AS ENUM ('QUOTATION', 'INVOICE');
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'FINALIZED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'ISSUED', 'VOID');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'UPI', 'CARD', 'OTHER');

CREATE TABLE "lead_followups" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "leadId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdByName" TEXT NOT NULL,
  "updatedById" TEXT,
  "updatedByName" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "deletedAt" TIMESTAMPTZ(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "requestKey" TEXT,
  "requestHash" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "scheduledAt" TIMESTAMPTZ(3) NOT NULL,
  "channel" "FollowUpChannel" NOT NULL DEFAULT 'CALL',
  "status" "FollowUpStatus" NOT NULL DEFAULT 'PENDING',
  "assignedTo" TEXT NOT NULL,
  "outcome" TEXT,
  "completedAt" TIMESTAMPTZ(3),
  "origin" "ActivityOrigin" NOT NULL DEFAULT 'USER',
  "legacyKey" TEXT UNIQUE
);
CREATE UNIQUE INDEX "lead_followups_createdById_requestKey_key" ON "lead_followups" ("createdById", "requestKey");
CREATE INDEX "lead_followups_leadId_deletedAt_scheduledAt_idx" ON "lead_followups" ("leadId", "deletedAt", "scheduledAt");
CREATE INDEX "lead_followups_leadId_status_scheduledAt_idx" ON "lead_followups" ("leadId", "status", "scheduledAt");

CREATE TABLE "lead_tasks" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "leadId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdByName" TEXT NOT NULL,
  "updatedById" TEXT,
  "updatedByName" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "deletedAt" TIMESTAMPTZ(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "requestKey" TEXT,
  "requestHash" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "dueAt" TIMESTAMPTZ(3) NOT NULL,
  "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
  "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
  "assignedTo" TEXT NOT NULL,
  "completedAt" TIMESTAMPTZ(3)
);
CREATE UNIQUE INDEX "lead_tasks_createdById_requestKey_key" ON "lead_tasks" ("createdById", "requestKey");
CREATE INDEX "lead_tasks_leadId_deletedAt_dueAt_idx" ON "lead_tasks" ("leadId", "deletedAt", "dueAt");
CREATE INDEX "lead_tasks_status_dueAt_idx" ON "lead_tasks" ("status", "dueAt");

CREATE TABLE "lead_meetings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "leadId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdByName" TEXT NOT NULL,
  "updatedById" TEXT,
  "updatedByName" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "deletedAt" TIMESTAMPTZ(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "requestKey" TEXT,
  "requestHash" TEXT,
  "title" TEXT NOT NULL,
  "agenda" TEXT,
  "startAt" TIMESTAMPTZ(3) NOT NULL,
  "endAt" TIMESTAMPTZ(3) NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  "mode" "MeetingMode" NOT NULL DEFAULT 'ONLINE',
  "location" TEXT,
  "meetingUrl" TEXT,
  "attendees" JSONB NOT NULL DEFAULT '[]',
  "assignedTo" TEXT NOT NULL,
  "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
  "outcome" TEXT,
  "completedAt" TIMESTAMPTZ(3)
);
CREATE UNIQUE INDEX "lead_meetings_createdById_requestKey_key" ON "lead_meetings" ("createdById", "requestKey");
CREATE INDEX "lead_meetings_leadId_deletedAt_startAt_idx" ON "lead_meetings" ("leadId", "deletedAt", "startAt");
CREATE INDEX "lead_meetings_status_startAt_idx" ON "lead_meetings" ("status", "startAt");

CREATE TABLE "lead_reminders" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "leadId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdByName" TEXT NOT NULL,
  "updatedById" TEXT,
  "updatedByName" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "deletedAt" TIMESTAMPTZ(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "requestKey" TEXT,
  "requestHash" TEXT,
  "title" TEXT NOT NULL,
  "message" TEXT,
  "remindAt" TIMESTAMPTZ(3) NOT NULL,
  "recipientId" TEXT NOT NULL,
  "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
  "followUpId" TEXT,
  "taskId" TEXT,
  "meetingId" TEXT,
  "triggeredAt" TIMESTAMPTZ(3),
  "dismissedAt" TIMESTAMPTZ(3)
);
CREATE UNIQUE INDEX "lead_reminders_createdById_requestKey_key" ON "lead_reminders" ("createdById", "requestKey");
CREATE INDEX "lead_reminders_status_deletedAt_remindAt_idx" ON "lead_reminders" ("status", "deletedAt", "remindAt");

CREATE TABLE "lead_history" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "leadId" TEXT NOT NULL,
  "entityType" "HistoryEntity" NOT NULL,
  "entityId" TEXT,
  "action" "HistoryAction" NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorName" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "changes" JSONB,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "lead_history_leadId_createdAt_id_idx" ON "lead_history" ("leadId", "createdAt", "id");

CREATE TABLE "sales_documents" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "leadId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdByName" TEXT NOT NULL,
  "updatedById" TEXT,
  "updatedByName" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "deletedAt" TIMESTAMPTZ(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "requestKey" TEXT,
  "requestHash" TEXT,
  "type" "DocumentType" NOT NULL,
  "documentNumber" TEXT UNIQUE,
  "documentDate" DATE NOT NULL,
  "validUntil" DATE,
  "dueDate" DATE,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
  "customerSnapshot" JSONB NOT NULL,
  "issuerSnapshot" JSONB NOT NULL,
  "notes" TEXT,
  "terms" TEXT,
  "subtotal" DECIMAL(16,2) NOT NULL DEFAULT 0,
  "discountTotal" DECIMAL(16,2) NOT NULL DEFAULT 0,
  "taxTotal" DECIMAL(16,2) NOT NULL DEFAULT 0,
  "grandTotal" DECIMAL(16,2) NOT NULL DEFAULT 0,
  "sourceQuotationId" TEXT,
  "finalizedAt" TIMESTAMPTZ(3)
);
CREATE UNIQUE INDEX "sales_documents_createdById_requestKey_key" ON "sales_documents" ("createdById", "requestKey");
CREATE INDEX "sales_documents_leadId_type_deletedAt_createdAt_idx" ON "sales_documents" ("leadId", "type", "deletedAt", "createdAt");
CREATE INDEX "sales_documents_type_status_documentDate_idx" ON "sales_documents" ("type", "status", "documentDate");

CREATE TABLE "sales_document_items" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "documentId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
  "unit" TEXT,
  "unitPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "discountAmount" DECIMAL(16,2) NOT NULL DEFAULT 0,
  "taxPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "grossAmount" DECIMAL(16,2) NOT NULL DEFAULT 0,
  "netAmount" DECIMAL(16,2) NOT NULL DEFAULT 0,
  "taxAmount" DECIMAL(16,2) NOT NULL DEFAULT 0,
  "totalAmount" DECIMAL(16,2) NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX "sales_document_items_documentId_position_key" ON "sales_document_items" ("documentId", "position");

CREATE TABLE "document_sequences" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "documentType" "DocumentType" NOT NULL,
  "year" INTEGER NOT NULL,
  "lastNumber" INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX "document_sequences_documentType_year_key" ON "document_sequences" ("documentType", "year");

CREATE TABLE "invoice_payments" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "invoiceId" TEXT NOT NULL,
  "amount" DECIMAL(16,2) NOT NULL DEFAULT 0,
  "paidAt" TIMESTAMPTZ(3) NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "reference" TEXT,
  "note" TEXT,
  "createdById" TEXT NOT NULL,
  "createdByName" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "requestKey" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "voidedAt" TIMESTAMPTZ(3),
  "voidedById" TEXT,
  "voidReason" TEXT
);
CREATE UNIQUE INDEX "invoice_payments_createdById_requestKey_key" ON "invoice_payments" ("createdById", "requestKey");
CREATE INDEX "invoice_payments_invoiceId_paidAt_idx" ON "invoice_payments" ("invoiceId", "paidAt");

CREATE TABLE "crm_notifications" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "leadId" TEXT NOT NULL,
  "reminderId" TEXT NOT NULL UNIQUE,
  "recipientId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMPTZ(3)
);
CREATE INDEX "crm_notifications_recipientId_readAt_createdAt_idx" ON "crm_notifications" ("recipientId", "readAt", "createdAt");
ALTER TABLE "lead_followups" ADD CONSTRAINT "lead_followups_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lead_tasks" ADD CONSTRAINT "lead_tasks_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lead_meetings" ADD CONSTRAINT "lead_meetings_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lead_reminders" ADD CONSTRAINT "lead_reminders_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lead_history" ADD CONSTRAINT "lead_history_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_documents" ADD CONSTRAINT "sales_documents_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crm_notifications" ADD CONSTRAINT "crm_notifications_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lead_reminders" ADD CONSTRAINT "lead_reminders_followUpId_fkey" FOREIGN KEY ("followUpId") REFERENCES "lead_followups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lead_reminders" ADD CONSTRAINT "lead_reminders_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "lead_tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "lead_reminders" ADD CONSTRAINT "lead_reminders_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "lead_meetings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_documents" ADD CONSTRAINT "sales_documents_sourceQuotationId_fkey" FOREIGN KEY ("sourceQuotationId") REFERENCES "sales_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_document_items" ADD CONSTRAINT "sales_document_items_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "sales_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "sales_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crm_notifications" ADD CONSTRAINT "crm_notifications_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "lead_reminders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lead_reminders" ADD CONSTRAINT "reminder_one_target" CHECK (num_nonnulls("followUpId", "taskId", "meetingId") <= 1);
ALTER TABLE "lead_meetings" ADD CONSTRAINT "meeting_valid_duration" CHECK ("endAt" > "startAt");
ALTER TABLE "sales_documents" ADD CONSTRAINT "document_valid_status" CHECK (
  ("type" = 'QUOTATION' AND "status" IN ('DRAFT','FINALIZED','ACCEPTED','REJECTED','CANCELLED') AND "dueDate" IS NULL AND "sourceQuotationId" IS NULL)
  OR ("type" = 'INVOICE' AND "status" IN ('DRAFT','ISSUED','VOID') AND "validUntil" IS NULL));
CREATE UNIQUE INDEX "one_active_invoice_per_quote" ON "sales_documents" ("sourceQuotationId") WHERE "type" = 'INVOICE' AND "deletedAt" IS NULL AND "status" <> 'VOID';
ALTER TABLE "sales_document_items" ADD CONSTRAINT "item_positive_values" CHECK ("quantity" > 0 AND "unitPrice" >= 0 AND "discountAmount" >= 0 AND "discountAmount" <= "grossAmount" AND "taxPercent" BETWEEN 0 AND 100);
ALTER TABLE "invoice_payments" ADD CONSTRAINT "payment_positive" CHECK ("amount" > 0);
-- Prisma UUIDs are TEXT. A deterministic legacy ID avoids extension requirements.
INSERT INTO "lead_followups" ("id","leadId","createdById","createdByName","createdAt","updatedAt","title","scheduledAt","assignedTo","origin","legacyKey")
SELECT md5('legacy-followup:' || "id")::uuid::text, "id", 'legacy-import', "createdBy",
  ("createdAt" AT TIME ZONE 'UTC'), CURRENT_TIMESTAMP, 'Imported follow-up',
  ("nextFollowUpAt" AT TIME ZONE 'UTC'), "assignedTo", 'LEGACY', 'lead-followup:' || "id"
FROM "leads" WHERE "nextFollowUpAt" IS NOT NULL
ON CONFLICT ("legacyKey") DO NOTHING;
INSERT INTO "lead_history" ("id","leadId","entityType","entityId","action","actorId","actorName","summary")
SELECT md5('legacy-history:' || "leadId")::uuid::text, "leadId", 'FOLLOWUP', "id", 'IMPORTED',
  'legacy-import', 'Legacy import', 'Follow-up schedule imported from the existing lead date'
FROM "lead_followups" WHERE "origin" = 'LEGACY'
ON CONFLICT ("id") DO NOTHING;
UPDATE "leads" l SET "nextFollowUpAt" = (
  SELECT MIN(f."scheduledAt") AT TIME ZONE 'UTC' FROM "lead_followups" f
  WHERE f."leadId" = l."id" AND f."status" = 'PENDING' AND f."deletedAt" IS NULL
);
