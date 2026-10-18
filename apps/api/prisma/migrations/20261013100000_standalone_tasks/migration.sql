-- Additive migration source prepared only; do not apply automatically.
CREATE TYPE "StandaloneTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "StandaloneTaskStatus" AS ENUM ('NEW', 'IN_FEEDBACK', 'COMPLETED', 'REJECTED', 'PROCESSING');
CREATE TYPE "TaskRecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
CREATE TYPE "TaskHistoryAction" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'LABEL_CHANGED', 'DELETED', 'RECURRENCE_STARTED', 'RECURRENCE_UPDATED', 'RECURRENCE_STOPPED', 'OCCURRENCE_GENERATED');

CREATE TABLE "task_labels" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "colour" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "deletedAt" TIMESTAMPTZ(3)
);
CREATE INDEX "task_labels_normalizedName_deletedAt_idx" ON "task_labels" ("normalizedName", "deletedAt");
CREATE UNIQUE INDEX "task_labels_normalizedName_active_key" ON "task_labels" ("normalizedName") WHERE "deletedAt" IS NULL;

CREATE TABLE "task_recurrence_series" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "subject" TEXT NOT NULL,
  "description" TEXT,
  "priority" "StandaloneTaskPriority" NOT NULL DEFAULT 'LOW',
  "labelId" TEXT,
  "assignedTo" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdByName" TEXT NOT NULL,
  "frequency" "TaskRecurrenceFrequency" NOT NULL,
  "interval" INTEGER NOT NULL DEFAULT 1,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  "anchorStartAt" TIMESTAMPTZ(3) NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "recurrenceEndsAt" TIMESTAMPTZ(3),
  "nextOccurrenceAt" TIMESTAMPTZ(3) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX "task_recurrence_series_active_nextOccurrenceAt_idx" ON "task_recurrence_series" ("active", "nextOccurrenceAt");
CREATE INDEX "task_recurrence_series_labelId_active_idx" ON "task_recurrence_series" ("labelId", "active");

CREATE TABLE "tasks" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "subject" TEXT NOT NULL,
  "description" TEXT,
  "priority" "StandaloneTaskPriority" NOT NULL DEFAULT 'LOW',
  "status" "StandaloneTaskStatus" NOT NULL DEFAULT 'NEW',
  "labelId" TEXT,
  "startAt" TIMESTAMPTZ(3) NOT NULL,
  "endAt" TIMESTAMPTZ(3) NOT NULL,
  "assignedTo" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdByName" TEXT NOT NULL,
  "updatedById" TEXT,
  "updatedByName" TEXT,
  "completedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "deletedAt" TIMESTAMPTZ(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "requestKey" TEXT,
  "requestHash" TEXT,
  "recurrenceSeriesId" TEXT,
  "occurrenceAt" TIMESTAMPTZ(3)
);
CREATE UNIQUE INDEX "tasks_createdById_requestKey_key" ON "tasks" ("createdById", "requestKey");
CREATE UNIQUE INDEX "tasks_recurrenceSeriesId_occurrenceAt_key" ON "tasks" ("recurrenceSeriesId", "occurrenceAt");
CREATE INDEX "tasks_status_deletedAt_endAt_idx" ON "tasks" ("status", "deletedAt", "endAt");
CREATE INDEX "tasks_assignedTo_deletedAt_endAt_idx" ON "tasks" ("assignedTo", "deletedAt", "endAt");
CREATE INDEX "tasks_labelId_deletedAt_idx" ON "tasks" ("labelId", "deletedAt");
CREATE INDEX "tasks_deletedAt_endAt_idx" ON "tasks" ("deletedAt", "endAt");
CREATE INDEX "tasks_recurrenceSeriesId_occurrenceAt_idx" ON "tasks" ("recurrenceSeriesId", "occurrenceAt");

CREATE TABLE "task_history" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "taskId" TEXT NOT NULL,
  "action" "TaskHistoryAction" NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorName" TEXT NOT NULL,
  "changes" JSONB,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "task_history_taskId_createdAt_id_idx" ON "task_history" ("taskId", "createdAt", "id");

ALTER TABLE "task_recurrence_series" ADD CONSTRAINT "task_recurrence_series_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "task_labels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "task_labels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_recurrenceSeriesId_fkey" FOREIGN KEY ("recurrenceSeriesId") REFERENCES "task_recurrence_series"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_history" ADD CONSTRAINT "task_history_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tasks" ADD CONSTRAINT "tasks_valid_schedule" CHECK ("endAt" > "startAt");
ALTER TABLE "task_recurrence_series" ADD CONSTRAINT "task_recurrence_series_valid_values" CHECK ("interval" > 0 AND "durationMinutes" > 0 AND ("recurrenceEndsAt" IS NULL OR "recurrenceEndsAt" >= "anchorStartAt"));
