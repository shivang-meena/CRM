BEGIN;

ALTER TABLE "leads" ADD COLUMN "assignedToId" TEXT;
ALTER TABLE "lead_followups" ADD COLUMN "assignedToId" TEXT;
ALTER TABLE "lead_meetings" ADD COLUMN "assignedToId" TEXT;
ALTER TABLE "lead_reminders" ADD COLUMN "assignedTo" TEXT, ADD COLUMN "assignedToId" TEXT;

WITH candidates AS (
  SELECT "id", "id" AS "adminId", "name" FROM "admins" WHERE "deletedAt" IS NULL
  UNION ALL
  SELECT "id", "adminId", trim("firstName" || ' ' || "lastName") AS "name"
  FROM "staff_members" WHERE "deletedAt" IS NULL
), unambiguous AS (
  SELECT "adminId", "name", min("id") AS "id" FROM candidates
  GROUP BY "adminId", "name" HAVING count(*) = 1
)
UPDATE "leads" AS record SET "assignedToId" = person."id"
FROM unambiguous AS person
WHERE record."adminId" = person."adminId" AND record."assignedTo" = person."name";

WITH candidates AS (
  SELECT "id", "id" AS "adminId", "name" FROM "admins" WHERE "deletedAt" IS NULL
  UNION ALL
  SELECT "id", "adminId", trim("firstName" || ' ' || "lastName") AS "name"
  FROM "staff_members" WHERE "deletedAt" IS NULL
), unambiguous AS (
  SELECT "adminId", "name", min("id") AS "id" FROM candidates
  GROUP BY "adminId", "name" HAVING count(*) = 1
)
UPDATE "lead_followups" AS record SET "assignedToId" = person."id"
FROM unambiguous AS person
WHERE record."adminId" = person."adminId" AND record."assignedTo" = person."name";

WITH candidates AS (
  SELECT "id", "id" AS "adminId", "name" FROM "admins" WHERE "deletedAt" IS NULL
  UNION ALL
  SELECT "id", "adminId", trim("firstName" || ' ' || "lastName") AS "name"
  FROM "staff_members" WHERE "deletedAt" IS NULL
), unambiguous AS (
  SELECT "adminId", "name", min("id") AS "id" FROM candidates
  GROUP BY "adminId", "name" HAVING count(*) = 1
)
UPDATE "lead_meetings" AS record SET "assignedToId" = person."id"
FROM unambiguous AS person
WHERE record."adminId" = person."adminId" AND record."assignedTo" = person."name";

WITH candidates AS (
  SELECT "id", "id" AS "adminId", "name" FROM "admins" WHERE "deletedAt" IS NULL
  UNION ALL
  SELECT "id", "adminId", trim("firstName" || ' ' || "lastName") AS "name"
  FROM "staff_members" WHERE "deletedAt" IS NULL
)
UPDATE "lead_reminders" AS record
SET "assignedToId" = person."id", "assignedTo" = person."name"
FROM candidates AS person
WHERE record."adminId" = person."adminId" AND record."recipientId" = person."id";

UPDATE "lead_reminders" SET "assignedTo" = "createdByName" WHERE "assignedTo" IS NULL;

COMMIT;
