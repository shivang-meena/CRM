ALTER TABLE "lead_meetings" ALTER COLUMN "leadId" DROP NOT NULL;
ALTER TABLE "lead_reminders" ALTER COLUMN "leadId" DROP NOT NULL;
ALTER TABLE "crm_notifications" ALTER COLUMN "leadId" DROP NOT NULL;
