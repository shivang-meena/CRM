# Recover the legacy Admin ownership migration

The migration `20261024091600_make_admin_id_required_and_tenant_uniques` makes
`adminId` mandatory on 23 tables. Older records first need to be linked to their
original Admin. A failed attempt can also have committed index drops before
reaching the first `NULL` value. Filling only `company_profile.adminId` or merely
marking the migration applied does not complete the migration.

The historical migration files are unchanged. The recovery tool is manual,
read-only by default, and refuses to write to remote database URLs. It is not
called by installation, the build command, or application startup. It never
changes Prisma migration history automatically.

## Inspect

From `apps/api`, using Node 22.9 or newer:

```sh
npm run db:tenant:inspect
```

This reads the database configured by `DATABASE_URL` and reports the migration
state and counts of unassigned rows. It does not print passwords or change data.

## Rehearse recovery on a local copy

Use a local database copy and select the Admin that owns the legacy data. Do not
choose an arbitrary Admin when the database contains multiple businesses.

```sh
npm run db:tenant:recover:local -- --admin-login-id ORIGINAL_ADMIN_LOGIN_ID
```

If the original Admin has not yet been created, preserve the original `LOGIN_ID`,
`LOGIN_PASS`, and optionally `LOGIN_NAME` environment variables, then explicitly
allow creation of that same Admin:

```sh
npm run db:tenant:recover:local -- --admin-login-id ORIGINAL_ADMIN_LOGIN_ID --create-legacy-admin
```

The tool only fills `NULL` ownership fields. Existing ownership and existing
Admin passwords are preserved. Backfill and the original migration's remaining
schema operations run in one transaction. Conflicts roll back that transaction;
the tool does not delete or merge records to make uniqueness checks pass. It
also verifies all required ownership columns and all 12 tenant unique indexes.

After successful recovery, inspect the result. If this exact migration is still
recorded as failed, resolve its history explicitly on the same local database:

```sh
npx prisma migrate resolve --applied 20261024091600_make_admin_id_required_and_tenant_uniques
npx prisma migrate deploy
npm run build
```

## Production remains a separate one-time operation

Pushing these files cannot clear an existing `P3009` entry in Neon. The current
Render build command remains unchanged. Production recovery must first have an
explicitly selected original Admin and authorization for the ownership backfill,
schema completion, and migration-history reconciliation. The local tool rejects
a remote `DATABASE_URL` when `--apply` is supplied.

The proposed production operation is the same sequence rehearsed locally:
inspect the failed migration and affected records; assign only unowned legacy
records to the confirmed original Admin; complete and verify all schema steps;
then explicitly resolve this migration and deploy the remaining migrations.
Do not mark it applied before the complete schema has been verified.

## Disposable PostgreSQL regression tests

`npm run test:migrations` runs unit checks. To include actual PostgreSQL recovery
tests, provide `MIGRATION_TEST_DATABASE_URL` pointing to a disposable local
database named exactly `codex_crm_migration_test`. The suite refuses any other
database name or remote host. It uses separate temporary schemas and removes
only those schemas after each test.

```sh
npm run test:migrations
```

Tests cover the actual `P3018` followed by `P3009`, completion after partial index
drops, explicit history resolution followed by all later migrations, repeated
recovery, ownership preservation, unchanged passwords, uniqueness conflicts,
incorrect existing indexes, default inspection, and refusal of remote writes.
