const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { Client } = require('pg');

const REQUIRED_TABLES = [
  'doctor_availability_overrides',
  'patient_clinical_notes',
];

const CORE_TABLES = [
  'users',
  'doctors',
  'patients',
  'appointments',
  'doctor_availability',
];

const BACKEND_ROOT = path.resolve(__dirname, '..');
const BASELINE_SQL_PATH = path.join(BACKEND_ROOT, 'drizzle', 'baseline_existing_db.sql');
const DRIZZLE_BIN = path.join(BACKEND_ROOT, 'node_modules', 'drizzle-kit', 'bin.cjs');

function runDrizzleMigrate() {
  console.log('[bootstrap] Running drizzle migrations');

  const result = spawnSync(
    process.execPath,
    [DRIZZLE_BIN, 'migrate', '--config=drizzle.config.ts'],
    {
      cwd: BACKEND_ROOT,
      env: process.env,
      stdio: 'inherit',
    },
  );

  if (result.status !== 0) {
    throw new Error(`Drizzle migrate failed with exit code ${result.status ?? 'unknown'}`);
  }
}

async function connectWithRetry(connectionString, retries = 20, delayMs = 1500) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const client = new Client({ connectionString });

    try {
      await client.connect();
      return client;
    } catch (error) {
      lastError = error;
      console.warn(
        `[bootstrap] Database connect attempt ${attempt}/${retries} failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      await client.end().catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError ?? new Error('Unable to connect to database');
}

async function getExistingTables(client, tableNames) {
  const result = await client.query(
    `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name = any($1::text[])
    `,
    [tableNames],
  );

  return result.rows.map((row) => row.table_name);
}

async function applyBaselineRepair(client) {
  const baselineSql = fs.readFileSync(BASELINE_SQL_PATH, 'utf8');
  console.log('[bootstrap] Applying baseline_existing_db.sql repair script');
  await client.query(baselineSql);
}

async function ensureRuntimeSchema() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required for startup');
  }

  runDrizzleMigrate();

  let client = await connectWithRetry(connectionString);

  try {
    const existingRequiredTables = await getExistingTables(client, REQUIRED_TABLES);
    const missingRequiredTables = REQUIRED_TABLES.filter(
      (tableName) => !existingRequiredTables.includes(tableName),
    );

    if (missingRequiredTables.length === 0) {
      console.log('[bootstrap] Required scheduling tables already exist');
      return;
    }

    const existingCoreTables = await getExistingTables(client, CORE_TABLES);

    if (existingCoreTables.length === 0) {
      throw new Error(
        `Database is missing required scheduling tables (${missingRequiredTables.join(
          ', ',
        )}) after migrate, and no core clinic tables were found`,
      );
    }

    console.warn(
      `[bootstrap] Detected broken existing DB state. Missing required tables: ${missingRequiredTables.join(
        ', ',
      )}`,
    );

    await applyBaselineRepair(client);

    const repairedRequiredTables = await getExistingTables(client, REQUIRED_TABLES);
    const stillMissingAfterBaseline = REQUIRED_TABLES.filter(
      (tableName) => !repairedRequiredTables.includes(tableName),
    );

    if (stillMissingAfterBaseline.length > 0) {
      throw new Error(
        `Baseline repair did not restore required scheduling tables: ${stillMissingAfterBaseline.join(
          ', ',
        )}`,
      );
    }

    runDrizzleMigrate();
    console.log('[bootstrap] Scheduling schema repair completed');
  } finally {
    await client.end().catch(() => {});
  }
}

async function main() {
  await ensureRuntimeSchema();

  console.log('[bootstrap] Starting API');

  const child = spawn(process.execPath, ['dist/main'], {
    cwd: BACKEND_ROOT,
    env: process.env,
    stdio: 'inherit',
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  console.error(
    '[bootstrap] Startup failed:',
    error instanceof Error ? error.stack ?? error.message : String(error),
  );
  process.exit(1);
});
