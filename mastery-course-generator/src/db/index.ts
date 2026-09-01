/**
 * Database connection + initialization.
 *
 * SQLite remains the local/default driver. This connection is deliberately
 * hardened for containerized production: WAL mode, busy timeouts, foreign-key
 * enforcement, and durable journaling are configured before Drizzle is created.
 */
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { getEnv } from '../lib/env';
import { schemaDdl } from './ddl';
import * as schema from './schema';

export type Database = BetterSQLite3Database<typeof schema>;

let db: Database | null = null;
let sqlite: Database.Database | null = null;

export function getDb(): Database {
  if (db) return db;

  const env = getEnv();
  const file = env.DATABASE_FILE;

  if (file !== ':memory:') {
    const abs = resolve(process.cwd(), file);
    mkdirSync(dirname(abs), { recursive: true });
  }

  sqlite = new Database(file);
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma(`busy_timeout = ${env.DATABASE_BUSY_TIMEOUT_MS}`);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('synchronous = NORMAL');
  sqlite.pragma('temp_store = MEMORY');
  sqlite.pragma('wal_autocheckpoint = 1000');

  for (const stmt of schemaDdl()) {
    sqlite.exec(stmt);
  }
  applyColumnMigrations(sqlite);

  db = drizzle(sqlite, { schema });
  return db;
}

/**
 * CREATE TABLE IF NOT EXISTS covers new tables but not new columns on
 * existing tables; add those here so older database files upgrade in place.
 */
function applyColumnMigrations(conn: Database.Database): void {
  const additions: Record<string, { column: string; ddl: string }[]> = {
    users: [
      { column: 'password_hash', ddl: 'ALTER TABLE users ADD COLUMN password_hash text' },
      { column: 'role', ddl: "ALTER TABLE users ADD COLUMN role text NOT NULL DEFAULT 'teacher'" },
    ],
  };
  for (const [table, cols] of Object.entries(additions)) {
    const existing = new Set(
      (conn.pragma(`table_info(${table})`) as { name: string }[]).map((c) => c.name),
    );
    for (const { column, ddl } of cols) {
      if (!existing.has(column)) conn.exec(ddl);
    }
  }
}

export function resetDb(): void {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
  }
  db = null;
}

export { schema };
