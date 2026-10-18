-- Additive migration source prepared only; do not apply automatically.
CREATE TYPE "CalendarEventCategory" AS ENUM ('EVENT', 'HOLIDAY', 'SERVICE');

CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "category" "CalendarEventCategory" NOT NULL DEFAULT 'EVENT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "endAt" TIMESTAMPTZ(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "updatedById" TEXT,
    "updatedByName" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "requestKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "calendar_events_end_after_start_check" CHECK ("endAt" > "startAt")
);

CREATE UNIQUE INDEX "calendar_events_createdById_requestKey_key" ON "calendar_events"("createdById", "requestKey");
CREATE INDEX "calendar_events_createdById_deletedAt_startAt_idx" ON "calendar_events"("createdById", "deletedAt", "startAt");
