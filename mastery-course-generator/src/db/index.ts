/**
 * Database connection + initialization.
 *
 * Uses `better-sqlite3` (synchronous, no native compilation issues) via
 * Drizzle's `drizzle-orm/better-sqlite3` driver. The schema is created from
 * `ddl.ts` on first connection.
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

/**
 * Open (or reuse) the SQLite database, applying DDL if needed.
 */
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
  sqlite.pragma('journal_mode = WAL');

  for (const stmt of schemaDdl()) {
    sqlite.exec(stmt);
  }

  db = drizzle(sqlite, { schema });
  return db;
}

/**
 * Test helper: reset the singleton and close the underlying handle.
 */
export function resetDb(): void {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
  }
  db = null;
}

export { schema };