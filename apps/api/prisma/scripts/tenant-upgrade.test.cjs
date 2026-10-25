const assert = require('node:assert/strict');
const { test, after } = require('node:test');
const {
  readFileSync,
  mkdtempSync,
  mkdirSync,
  copyFileSync,
  cpSync,
  readdirSync,
  rmSync,
} = require('node:fs');
const { resolve, join, sep } = require('node:path');
const { tmpdir } = require('node:os');
const { spawnSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const {
  TENANT_MIGRATION,
  TENANT_TABLES,
  assertLocalDatabase,
  migrationHistory,
  isFailed,
  isRecoverableFailure,
  recoveryPlan,
  nullOwnerCounts,
  recoverLocalTenantMigration,
} = require('./tenant-upgrade.cjs');

const API_ROOT = resolve(__dirname, '../..');
const MIGRATIONS = join(API_ROOT, 'prisma/migrations');
const sql = readFileSync(
  join(MIGRATIONS, TENANT_MIGRATION, 'migration.sql'),
  'utf8',
);
const legacyEnv = {
  LOGIN_ID: 'original-owner',
  LOGIN_PASS: 'local-test-password-only',
  LOGIN_NAME: 'Original Owner',
};

test('recovery preserves every original DDL operation and verifies all tenant indexes', () => {
  const plan = recoveryPlan(sql);
  assert.equal(plan.statements.length, 47);
  assert.equal(plan.indexes.length, 12);
  assert.equal(TENANT_TABLES.length, 23);
  assert.equal(
    plan.statements.filter((statement) =>
      statement.startsWith('DROP INDEX IF EXISTS'),
    ).length,
    12,
  );
  assert.equal(
    plan.statements.filter((statement) =>
      statement.startsWith('CREATE UNIQUE INDEX IF NOT EXISTS'),
    ).length,
    12,
  );
  assert.throws(
    () => recoveryPlan(sql + '\nDROP TABLE "leads";'),
    /Unsupported SQL/,
  );
});

test('only the exact known NULL-owner failure is eligible for recovery', () => {
  const known = {
    migration_name: TENANT_MIGRATION,
    logs: 'Database error code: 23502; adminId contains null values',
  };
  assert.equal(isRecoverableFailure(known), true);
  assert.equal(
    isRecoverableFailure({ ...known, migration_name: 'another-migration' }),
    false,
  );
  assert.equal(
    isRecoverableFailure({ ...known, logs: '23505 duplicate key' }),
    false,
  );
  assert.equal(
    isFailed({ finished_at: new Date(), rolled_back_at: null }),
    false,
  );
  assert.equal(
    isFailed({ finished_at: null, rolled_back_at: new Date() }),
    false,
  );
});

test('apply refuses remote database URLs before making any database call', async () => {
  assert.doesNotThrow(() =>
    assertLocalDatabase('postgresql://test:test@127.0.0.1:5432/test'),
  );
  let called = false;
  const db = {
    $queryRawUnsafe() {
      called = true;
    },
  };
  await assert.rejects(
    recoverLocalTenantMigration(db, {
      databaseUrl: 'postgresql://test:test@db.example/test',
    }),
    /only writes to a local database/,
  );
  assert.equal(called, false);
});

const TEST_URL = process.env.MIGRATION_TEST_DATABASE_URL;
let control;
if (TEST_URL) {
  const parsed = new URL(TEST_URL);
  assertLocalDatabase(TEST_URL);
  assert.equal(
    parsed.pathname,
    '/codex_crm_migration_test',
    'Integration tests require the explicitly named disposable test database.',
  );
  control = new PrismaClient({ datasources: { db: { url: TEST_URL } } });
  after(() => control.$disconnect());
}

function prismaCommand(url, args) {
  return spawnSync(
    process.execPath,
    [require.resolve('prisma/build/index.js'), ...args],
    {
      cwd: API_ROOT,
      env: { ...process.env, DATABASE_URL: url },
      encoding: 'utf8',
      timeout: 120000,
    },
  );
}

function successful(result) {
  assert.equal(result.status, 0, result.stdout + result.stderr);
}

let sequence = 0;
async function legacyDatabase(t) {
  const schema = `codex_tenant_test_${++sequence}`;
  await control.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
  const url = new URL(TEST_URL);
  url.searchParams.set('schema', schema);
  const databaseUrl = url.toString();
  const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const staged = mkdtempSync(join(tmpdir(), 'codex-crm-migration-'));
  t.after(async () => {
    await db.$disconnect();
    assert.match(schema, /^codex_tenant_test_\d+$/);
    await control.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
    const absolute = resolve(staged);
    assert.ok(
      absolute.startsWith(resolve(tmpdir()) + sep + 'codex-crm-migration-'),
    );
    rmSync(absolute, { recursive: true, force: true });
  });
  copyFileSync(
    join(API_ROOT, 'prisma/schema.prisma'),
    join(staged, 'schema.prisma'),
  );
  mkdirSync(join(staged, 'migrations'));
  copyFileSync(
    join(MIGRATIONS, 'migration_lock.toml'),
    join(staged, 'migrations/migration_lock.toml'),
  );
  for (const entry of readdirSync(MIGRATIONS, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name < TENANT_MIGRATION)
      cpSync(
        join(MIGRATIONS, entry.name),
        join(staged, 'migrations', entry.name),
        { recursive: true },
      );
  }
  successful(
    prismaCommand(databaseUrl, [
      'migrate',
      'deploy',
      '--schema',
      join(staged, 'schema.prisma'),
    ]),
  );
  await db.$executeRawUnsafe(
    'INSERT INTO "company_profile" ("companyName", "updatedAt") VALUES ($1, NOW())',
    'Legacy Company',
  );
  return { db, databaseUrl, migrationDirectory: MIGRATIONS };
}

async function failOriginalMigration(context) {
  const result = prismaCommand(context.databaseUrl, ['migrate', 'deploy']);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /23502|contains null values/);
  const failures = (await migrationHistory(context.db)).filter(isFailed);
  assert.equal(failures.length, 1);
  assert.equal(isRecoverableFailure(failures[0]), true);
}

test(
  'recovers the actual P3018/P3009 database state, retains data, and allows all later migrations',
  { skip: !TEST_URL },
  async (t) => {
    const context = await legacyDatabase(t);
    const { db, databaseUrl } = context;
    await db.$executeRawUnsafe(`INSERT INTO "leads" ("id", "name", "phone", "createdBy", "assignedTo", "updatedAt")
    VALUES ('legacy-lead', 'Saved Lead', '1234567890', 'original-owner', 'Original Owner', NOW())`);
    await db.$executeRawUnsafe(
      'INSERT INTO "gst_invoice_settings" ("updatedAt") VALUES (NOW())',
    );
    await failOriginalMigration(context);
    const blocked = prismaCommand(databaseUrl, ['migrate', 'deploy']);
    assert.match(blocked.stdout + blocked.stderr, /P3009/);
    const [removed] = await db.$queryRawUnsafe(
      "SELECT to_regclass('company_profile_adminId_idx')::text AS name",
    );
    assert.equal(
      removed.name,
      null,
      'The original migration has already committed its index drops.',
    );

    const before = await nullOwnerCounts(db);
    const result = await recoverLocalTenantMigration(db, {
      ...context,
      env: legacyEnv,
      adminLoginId: legacyEnv.LOGIN_ID,
      createLegacyAdmin: true,
    });
    assert.equal(
      result.rows,
      before.reduce((total, row) => total + row.count, 0),
    );
    assert.deepEqual(await nullOwnerCounts(db), []);
    const owner = await db.admin.findUnique({
      where: { loginId: legacyEnv.LOGIN_ID },
    });
    assert.ok(await bcrypt.compare(legacyEnv.LOGIN_PASS, owner.passwordHash));
    const [profile] = await db.$queryRawUnsafe(
      'SELECT "companyName", "adminId" FROM "company_profile"',
    );
    assert.deepEqual(profile, {
      companyName: 'Legacy Company',
      adminId: owner.id,
    });
    assert.equal(
      (await migrationHistory(db)).filter(isFailed).length,
      1,
      'The repair must not silently change migration history.',
    );

    successful(
      prismaCommand(databaseUrl, [
        'migrate',
        'resolve',
        '--applied',
        TENANT_MIGRATION,
      ]),
    );
    successful(prismaCommand(databaseUrl, ['migrate', 'deploy']));
    const [lead] = await db.$queryRawUnsafe(
      'SELECT "name", "adminId", "assignedToId" FROM "leads" WHERE "id" = $1',
      'legacy-lead',
    );
    assert.deepEqual(lead, {
      name: 'Saved Lead',
      adminId: owner.id,
      assignedToId: owner.id,
    });
    assert.deepEqual(
      await recoverLocalTenantMigration(db, {
        ...context,
        env: {},
        adminLoginId: legacyEnv.LOGIN_ID,
      }),
      { rows: 0, tables: 0 },
    );
    assert.equal((await migrationHistory(db)).filter(isFailed).length, 0);
  },
);

test(
  'default inspection is read-only and missing owner selection stops before backfilling',
  { skip: !TEST_URL },
  async (t) => {
    const context = await legacyDatabase(t);
    await failOriginalMigration(context);
    const before = await nullOwnerCounts(context.db);
    const inspection = spawnSync(
      process.execPath,
      [join(__dirname, 'recover-tenant-upgrade.cjs')],
      {
        cwd: API_ROOT,
        env: { ...process.env, DATABASE_URL: context.databaseUrl },
        encoding: 'utf8',
        timeout: 30000,
      },
    );
    successful(inspection);
    assert.match(inspection.stdout, /read-only/);
    assert.deepEqual(await nullOwnerCounts(context.db), before);
    await assert.rejects(
      recoverLocalTenantMigration(context.db, { ...context, env: legacyEnv }),
      /No owner is chosen automatically/,
    );
    assert.deepEqual(await nullOwnerCounts(context.db), before);
    assert.equal(await context.db.admin.count(), 0);
  },
);

test(
  'preserves already-owned data and never resets an existing Admin password',
  { skip: !TEST_URL },
  async (t) => {
    const context = await legacyDatabase(t);
    const hash = await bcrypt.hash('existing-local-password', 4);
    const owner = await context.db.admin.create({
      data: { loginId: 'selected-owner', passwordHash: hash, name: 'Owner' },
    });
    const other = await context.db.admin.create({
      data: { loginId: 'other-owner', passwordHash: hash, name: 'Other' },
    });
    await context.db.$executeRawUnsafe(
      `INSERT INTO "leads" ("id", "name", "phone", "createdBy", "assignedTo", "updatedAt", "adminId")
    VALUES ('owned-lead', 'Other Business', '123', 'other', 'Other', NOW(), $1)`,
      other.id,
    );
    await failOriginalMigration(context);
    await recoverLocalTenantMigration(context.db, {
      ...context,
      env: legacyEnv,
      adminLoginId: owner.loginId,
    });
    const [lead] = await context.db.$queryRawUnsafe(
      'SELECT "adminId" FROM "leads" WHERE "id" = $1',
      'owned-lead',
    );
    assert.equal(lead.adminId, other.id);
    assert.equal(
      (await context.db.admin.findUnique({ where: { id: owner.id } }))
        .passwordHash,
      hash,
    );
    assert.equal(await context.db.admin.count(), 2);
  },
);

test(
  'unique conflicts roll back all backfills and creation of the legacy Admin',
  { skip: !TEST_URL },
  async (t) => {
    const context = await legacyDatabase(t);
    await context.db.$executeRawUnsafe(
      'INSERT INTO "company_profile" ("id", "companyName", "updatedAt") VALUES ($1, $2, NOW())',
      'second-profile',
      'Second Company',
    );
    await failOriginalMigration(context);
    const before = await nullOwnerCounts(context.db);
    await assert.rejects(
      recoverLocalTenantMigration(context.db, {
        ...context,
        env: legacyEnv,
        adminLoginId: legacyEnv.LOGIN_ID,
        createLegacyAdmin: true,
      }),
      /unique|duplicate/i,
    );
    assert.deepEqual(await nullOwnerCounts(context.db), before);
    assert.equal(await context.db.admin.count(), 0);
    assert.equal(
      (await migrationHistory(context.db)).filter(isFailed).length,
      1,
    );
  },
);

test(
  'an existing index with the wrong definition is detected and not trusted',
  { skip: !TEST_URL },
  async (t) => {
    const context = await legacyDatabase(t);
    await failOriginalMigration(context);
    await context.db.$executeRawUnsafe(
      'CREATE INDEX "company_profile_adminId_key" ON "company_profile"("companyName")',
    );
    const before = await nullOwnerCounts(context.db);
    await assert.rejects(
      recoverLocalTenantMigration(context.db, {
        ...context,
        env: legacyEnv,
        adminLoginId: legacyEnv.LOGIN_ID,
        createLegacyAdmin: true,
      }),
      /does not match the migration/,
    );
    assert.deepEqual(await nullOwnerCounts(context.db), before);
    assert.equal(await context.db.admin.count(), 0);
  },
);
