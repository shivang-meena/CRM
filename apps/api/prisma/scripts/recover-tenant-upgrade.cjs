// Manual tool only. Default mode is read-only; --apply refuses all remote databases.
const { resolve } = require('node:path');
const { PrismaClient } = require('@prisma/client');
const {
  TENANT_MIGRATION,
  assertLocalDatabase,
  migrationHistory,
  nullOwnerCounts,
  recoverLocalTenantMigration,
} = require('./tenant-upgrade.cjs');

async function main() {
  const args = process.argv.slice(2);
  const allowed = new Set([
    '--apply',
    '--create-legacy-admin',
    '--admin-login-id',
  ]);
  let adminLoginId;
  for (let i = 0; i < args.length; i++) {
    if (!allowed.has(args[i])) throw new Error(`Unknown option: ${args[i]}`);
    if (args[i] === '--admin-login-id') {
      adminLoginId = args[++i];
      if (!adminLoginId || adminLoginId.startsWith('--'))
        throw new Error('--admin-login-id needs a value.');
    }
  }
  const apply = args.includes('--apply');
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required.');
  if (apply) assertLocalDatabase(databaseUrl);
  const db = new PrismaClient();
  try {
    const history = await migrationHistory(db);
    const target = history.filter(
      (row) => row.migration_name === TENANT_MIGRATION,
    );
    const counts = await nullOwnerCounts(db);
    console.log(
      JSON.stringify(
        {
          mode: apply ? 'apply-local-only' : 'read-only',
          migration: TENANT_MIGRATION,
          history: target.map((row) => ({
            finished: !!row.finished_at,
            rolledBack: !!row.rolled_back_at,
          })),
          unassignedRows: counts,
          selectedAdminLoginId: adminLoginId ?? null,
        },
        null,
        2,
      ),
    );
    if (!apply) return;
    const result = await recoverLocalTenantMigration(db, {
      databaseUrl,
      adminLoginId,
      createLegacyAdmin: args.includes('--create-legacy-admin'),
      env: process.env,
      migrationDirectory: resolve(__dirname, '../migrations'),
    });
    console.log(
      `Local recovery committed: ${result.rows} rows across ${result.tables} tables. Constraints and indexes verified.`,
    );
    console.log(
      'Migration history was not changed. Review the result before using prisma migrate resolve.',
    );
  } finally {
    await db.$disconnect();
  }
}

if (require.main === module)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
