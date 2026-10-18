CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'INACTIVE');

CREATE TABLE "staff_members" (
  "id" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "birthDate" DATE,
  "joiningDate" DATE NOT NULL,
  "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
  "department" TEXT,
  "designation" TEXT,
  "employeeCode" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "deletedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "staff_members_email_key" ON "staff_members"("email");
CREATE UNIQUE INDEX "staff_members_employeeCode_key" ON "staff_members"("employeeCode");
CREATE INDEX "staff_members_status_deletedAt_idx" ON "staff_members"("status", "deletedAt");
CREATE INDEX "staff_members_lastName_firstName_idx" ON "staff_members"("lastName", "firstName");
CREATE INDEX "staff_members_joiningDate_idx" ON "staff_members"("joiningDate");
