/**
 * Boots a local PostgreSQL 17 instance for development using npm-distributed
 * binaries, so no system package manager (apt/brew) is required.
 *
 *   pnpm --filter @aabha/backend db:local
 *
 * Data lives in `apps/backend/.pgdata` (git-ignored). Ctrl-C stops the server.
 * In CI or production this script is never used — point DATABASE_URL at a real
 * managed PostgreSQL cluster instead.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { Client } from 'pg';

const requireFrom = createRequire(__filename);

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, '.pgdata');
const PORT = Number(process.env.LOCAL_PG_PORT ?? 5433);
const USER = process.env.LOCAL_PG_USER ?? 'aabha';
const PASSWORD = process.env.LOCAL_PG_PASSWORD ?? 'aabha';
const DB_NAME = process.env.LOCAL_PG_DATABASE ?? 'aabha';

function resolveBinDir(): string {
  const pkg = `@embedded-postgres/${process.platform}-${process.arch}`;
  // Platform packages don't export `./package.json`, so resolve the entry point
  // and walk up until we find the bundled binaries.
  let dir = path.dirname(requireFrom.resolve(pkg));
  while (!existsSync(path.join(dir, 'native', 'bin')) && dir !== path.dirname(dir)) {
    dir = path.dirname(dir);
  }
  const binDir = path.join(dir, 'native', 'bin');
  if (!existsSync(binDir)) throw new Error(`PostgreSQL binaries not found for ${pkg}`);
  return binDir;
}

async function waitForServer(): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const client = new Client({
      host: '127.0.0.1',
      port: PORT,
      user: USER,
      password: PASSWORD,
      database: 'postgres',
      connectionTimeoutMillis: 1000,
    });
    try {
      await client.connect();
      await client.end();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error('PostgreSQL did not become ready in time');
}

async function ensureDatabase(): Promise<void> {
  const client = new Client({
    host: '127.0.0.1',
    port: PORT,
    user: USER,
    password: PASSWORD,
    database: 'postgres',
  });
  await client.connect();
  const { rows } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [DB_NAME]);
  if (rows.length === 0) {
    await client.query(`CREATE DATABASE "${DB_NAME}"`);
    console.info(`[db:local] created database "${DB_NAME}"`);
  }
  await client.end();
}

async function main(): Promise<void> {
  const binDir = resolveBinDir();

  if (!existsSync(path.join(DATA_DIR, 'PG_VERSION'))) {
    console.info('[db:local] initialising cluster…');
    await mkdir(DATA_DIR, { recursive: true });
    const pwFile = path.join(ROOT, '.pgpass.tmp');
    writeFileSync(pwFile, PASSWORD, { mode: 0o600 });
    const init = spawnSync(
      path.join(binDir, 'initdb'),
      ['-D', DATA_DIR, '-U', USER, `--pwfile=${pwFile}`, '-A', 'password', '-E', 'UTF8'],
      { stdio: 'inherit' },
    );
    rmSync(pwFile, { force: true });
    if (init.status !== 0) throw new Error(`initdb exited with code ${init.status}`);
  }

  const server = spawn(
    path.join(binDir, 'postgres'),
    ['-D', DATA_DIR, '-p', String(PORT), '-c', 'listen_addresses=127.0.0.1'],
    { stdio: ['ignore', 'inherit', 'inherit'] },
  );
  server.on('exit', (code) => process.exit(code ?? 0));

  await waitForServer();
  await ensureDatabase();

  console.info(`[db:local] ready → postgresql://${USER}:${PASSWORD}@127.0.0.1:${PORT}/${DB_NAME}`);

  const shutdown = (): void => {
    console.info('\n[db:local] stopping…');
    server.kill('SIGINT');
    setTimeout(() => process.exit(0), 1500);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('[db:local] failed:', error);
  process.exit(1);
});
