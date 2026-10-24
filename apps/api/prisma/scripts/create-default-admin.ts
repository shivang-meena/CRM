/**
 * ONE-TIME SCRIPT.
 * Creates the "default admin" from the OLD .env login (LOGIN_ID / LOGIN_PASS / LOGIN_NAME)
 * and assigns ALL existing rows to it.
 * Safe to run more than once: it only touches rows whose adminId is still NULL.
 *
 * Run (from apps/api):
 *   node --env-file=.env -r ts-node/register prisma/scripts/create-default-admin.ts
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Real table names (the @@map names in schema.prisma). Exactly 23. Constants only, never user input.
const TENANT_TABLES = [
  'leads',
  'service_masters',
  'product_masters',
  'lead_status_masters',
  'customers',
  'lead_followups',
  'lead_meetings',
  'lead_reminders',
  'lead_history',
  'sales_documents',
  'hsn_master',
  'payment_method_masters',
  'brochure_masters',
  'document_sequences',
  'invoice_payments',
  'crm_notifications',
  'notes',
  'calendar_events',
  'staff_members',
  'gst_invoice_settings',
  'non_gst_invoice_settings',
  'company_profile',
  'leave_requests',
];

async function main() {
  const id = process.env.LOGIN_ID?.trim();
  const pass = process.env.LOGIN_PASS;
  const name = process.env.LOGIN_NAME?.trim() || 'Admin';
  if (!id || !pass) {
    throw new Error('LOGIN_ID and LOGIN_PASS must be set in apps/api/.env for this one-time script.');
  }

  const passwordHash = await bcrypt.hash(pass, 10);
  const admin = await prisma.admin.upsert({
    where: { id },
    update: {},
    create: { id, loginId: id.toLowerCase(), passwordHash, name, businessName: name },
  });

  for (const table of TENANT_TABLES) {
    const count = await prisma.$executeRawUnsafe(
      `UPDATE "${table}" SET "adminId" = $1 WHERE "adminId" IS NULL`,
      admin.id,
    );
    console.log(`${table}: ${count} row(s) assigned to default admin`);
  }
  console.log(`Done. Default admin loginId = "${admin.loginId}"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
