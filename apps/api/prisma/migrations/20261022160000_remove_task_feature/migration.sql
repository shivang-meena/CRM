-- Task records and task-linked reminders are intentionally retired with the Task feature.
ALTER TABLE "lead_reminders" DROP CONSTRAINT IF EXISTS "lead_reminders_taskId_fkey";
ALTER TABLE "lead_reminders" DROP COLUMN IF EXISTS "taskId";

DROP TABLE IF EXISTS "lead_tasks" CASCADE;
DROP TABLE IF EXISTS "task_history" CASCADE;
DROP TABLE IF EXISTS "tasks" CASCADE;
DROP TABLE IF EXISTS "task_recurrence_series" CASCADE;
DROP TABLE IF EXISTS "task_labels" CASCADE;

ALTER TABLE "staff_members" DROP COLUMN IF EXISTS "permTask";

DELETE FROM "lead_history" WHERE "entityType"::text = 'TASK';
CREATE TYPE "HistoryEntity_new" AS ENUM ('LEAD', 'FOLLOWUP', 'REMINDER', 'MEETING', 'QUOTATION', 'INVOICE', 'PAYMENT');
ALTER TABLE "lead_history" ALTER COLUMN "entityType" TYPE "HistoryEntity_new"
  USING ("entityType"::text::"HistoryEntity_new");
DROP TYPE "HistoryEntity";
ALTER TYPE "HistoryEntity_new" RENAME TO "HistoryEntity";

DROP TYPE IF EXISTS "TaskPriority";
DROP TYPE IF EXISTS "TaskStatus";
DROP TYPE IF EXISTS "StandaloneTaskPriority";
DROP TYPE IF EXISTS "StandaloneTaskStatus";
DROP TYPE IF EXISTS "TaskRecurrenceFrequency";
DROP TYPE IF EXISTS "TaskHistoryAction";
