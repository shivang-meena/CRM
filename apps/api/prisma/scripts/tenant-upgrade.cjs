const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const bcrypt = require('bcryptjs');

const TENANT_MIGRATION =
  '20261024091600_make_admin_id_required_and_tenant_uniques';
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

function assertLocalDatabase(databaseUrl) {
  const url = new URL(databaseUrl);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error(
      'This recovery tool only writes to a local database. Production recovery requires separate authorization; no remote changes were made.',
    );
  }
}

async function migrationHistory(db) {
  const [table] = await db.$queryRawUnsafe(
    'SELECT to_regclass(\'"_prisma_migrations"\')::text AS name',
  );
  if (!table.name) return [];
  return db.$queryRawUnsafe(
    'SELECT migration_name, finished_at, rolled_back_at, logs FROM "_prisma_migrations"',
  );
}

function isFailed(row) {
  return !row.finished_at && !row.rolled_back_at;
}

function isRecoverableFailure(row) {
  return (
    row.migration_name === TENANT_MIGRATION &&
    /adminId/.test(row.logs ?? '') &&
    /23502|contains null values/.test(row.logs ?? '')
  );
}

// Replay only the DDL in the known migration, tolerating its already-completed prefix.
function recoveryPlan(sql) {
  const statements = [];
  const indexes = [];
  for (const part of sql.replace(/^\s*--[^\n]*$/gm, '').split(';')) {
    const statement = part.replace(/\s+/g, ' ').trim();
    if (!statement) continue;
    if (/^DROP INDEX "[a-zA-Z0-9_]+"$/.test(statement)) {
      statements.push(
        statement.replace('DROP INDEX ', 'DROP INDEX IF EXISTS '),
      );
      continue;
    }
    const index =
      /^CREATE UNIQUE INDEX "([a-zA-Z0-9_]+)" ON "([a-zA-Z0-9_]+)"\((.+)\)$/.exec(
        statement,
      );
    if (index && TENANT_TABLES.includes(index[2])) {
      const columns = index[3].split(',').map((column) => {
        const match = /^"([a-zA-Z0-9_]+)"$/.exec(column.trim());
        if (!match) throw new Error('Unsupported tenant index column.');
        return match[1];
      });
      indexes.push({ name: index[1], table: index[2], columns });
      statements.push(
        statement.replace(
          'CREATE UNIQUE INDEX ',
          'CREATE UNIQUE INDEX IF NOT EXISTS ',
        ),
      );
      continue;
    }
    const alter = /^ALTER TABLE "([a-zA-Z0-9_]+)" (.+)$/.exec(statement);
    if (
      alter &&
      TENANT_TABLES.includes(alter[1]) &&
      alter[2]
        .split(',')
        .every((operation) =>
          /^ALTER COLUMN "[a-zA-Z0-9_]+" (SET NOT NULL|DROP DEFAULT|SET DEFAULT '')$/.test(
            operation.trim(),
          ),
        )
    ) {
      statements.push(statement);
      continue;
    }
    throw new Error(
      'Unsupported SQL in the tenant migration. Recovery stopped.',
    );
  }
  if (indexes.length !== 12 || statements.length !== 47)
    throw new Error(
      'The tenant migration changed. Inspect it before recovery.',
    );
  return { statements, indexes };
}

async function nullOwnerCounts(db) {
  const counts = [];
  for (const table of TENANT_TABLES) {
    const [row] = await db.$queryRawUnsafe(
      `SELECT count(*)::int AS count FROM "${table}" WHERE "adminId" IS NULL`,
    );
    if (row.count) counts.push({ table, count: row.count });
  }
  return counts;
}

async function selectedOwner(tx, options) {
  const loginId = options.adminLoginId?.trim().toLowerCase();
  if (!loginId)
    throw new Error(
      'Select the original data owner with --admin-login-id. No owner is chosen automatically.',
    );
  const existing = await tx.admin.findUnique({ where: { loginId } });
  if (existing) {
    if (existing.deletedAt)
      throw new Error(
        'The selected Admin has been deleted. Choose the correct data owner.',
      );
    return existing;
  }
  const oldId = options.env.LOGIN_ID?.trim();
  if (
    !options.createLegacyAdmin ||
    !oldId ||
    loginId !== oldId.toLowerCase() ||
    !options.env.LOGIN_PASS
  ) {
    throw new Error(
      'The selected Admin does not exist. Creating the original Admin requires --create-legacy-admin and its original LOGIN_ID / LOGIN_PASS environment variables.',
    );
  }
  const name = options.env.LOGIN_NAME?.trim() || 'Admin';
  return tx.admin.create({
    data: {
      id: oldId,
      loginId,
      name,
      businessName: name,
      passwordHash: await bcrypt.hash(options.env.LOGIN_PASS, 10),
    },
  });
}

async function verifyTenantSchema(tx, indexes) {
  const columns = await tx.$queryRawUnsafe(`
    SELECT table_name, is_nullable FROM information_schema.columns
    WHERE table_schema = current_schema() AND column_name = 'adminId'
  `);
  for (const table of TENANT_TABLES) {
    if (
      !columns.some(
        (column) => column.table_name === table && column.is_nullable === 'NO',
      )
    ) {
      throw new Error(`Tenant ownership constraint is missing on ${table}.`);
    }
  }
  for (const expected of indexes) {
    const [actual] = await tx.$queryRawUnsafe(
      `
      SELECT tbl.relname AS table_name, idx.indisunique AS is_unique,
        idx.indisvalid AS is_valid, idx.indisready AS is_ready,
        idx.indpred IS NULL AS no_predicate, idx.indexprs IS NULL AS no_expressions,
        idx.indnkeyatts = idx.indnatts AS no_included_columns,
        ARRAY(SELECT att.attname::text FROM unnest(idx.indkey) WITH ORDINALITY AS key(attnum, position)
          JOIN pg_attribute att ON att.attrelid = tbl.oid AND att.attnum = key.attnum
          ORDER BY key.position) AS columns
      FROM pg_index idx JOIN pg_class ix ON ix.oid = idx.indexrelid
      JOIN pg_class tbl ON tbl.oid = idx.indrelid
      JOIN pg_namespace ns ON ns.oid = ix.relnamespace
      WHERE ns.nspname = current_schema() AND ix.relname = $1
    `,
      expected.name,
    );
    if (
      !actual ||
      actual.table_name !== expected.table ||
      !actual.is_unique ||
      !actual.is_valid ||
      !actual.is_ready ||
      !actual.no_predicate ||
      !actual.no_expressions ||
      !actual.no_included_columns ||
      JSON.stringify(actual.columns) !== JSON.stringify(expected.columns)
    ) {
      throw new Error(
        `Tenant index ${expected.name} does not match the migration. Recovery stopped.`,
      );
    }
  }
}

async function recoverLocalTenantMigration(db, options) {
  assertLocalDatabase(options.databaseUrl);
  const failures = (await migrationHistory(db)).filter(isFailed);
  if (
    failures.length &&
    (failures.length !== 1 || !isRecoverableFailure(failures[0]))
  ) {
    throw new Error(
      'Only the known adminId NULL migration failure can be recovered by this tool.',
    );
  }
  const plan = recoveryPlan(
    readFileSync(
      join(options.migrationDirectory, TENANT_MIGRATION, 'migration.sql'),
      'utf8',
    ),
  );
  return db.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(781231902)');
      const counts = await nullOwnerCounts(tx);
      let rows = 0;
      if (counts.length) {
        const owner = await selectedOwner(tx, options);
        for (const { table } of counts) {
          rows += await tx.$executeRawUnsafe(
            `UPDATE "${table}" SET "adminId" = $1 WHERE "adminId" IS NULL`,
            owner.id,
          );
        }
      }
      for (const statement of plan.statements)
        await tx.$executeRawUnsafe(statement);
      await verifyTenantSchema(tx, plan.indexes);
      return { rows, tables: counts.length };
    },
    { maxWait: 30000, timeout: 300000 },
  );
}

module.exports = {
  TENANT_MIGRATION,
  TENANT_TABLES,
  assertLocalDatabase,
  migrationHistory,
  isFailed,
  isRecoverableFailure,
  recoveryPlan,
  nullOwnerCounts,
  recoverLocalTenantMigration,
};
