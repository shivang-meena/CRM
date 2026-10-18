-- Additive migration source prepared only; do not apply automatically.
CREATE TABLE "notes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "content" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdByName" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  "deletedAt" TIMESTAMPTZ(3),
  "version" INTEGER NOT NULL DEFAULT 1,
  "requestKey" TEXT,
  "requestHash" TEXT
);

CREATE UNIQUE INDEX "notes_createdById_requestKey_key" ON "notes" ("createdById", "requestKey");
CREATE INDEX "notes_createdById_deletedAt_createdAt_id_idx" ON "notes" ("createdById", "deletedAt", "createdAt", "id");
