/**
 * Drop and recreate all tables (DESTRUCTIVE — development/test only).
 *
 * `npm run db:reset` wipes the configured database and re-applies the schema.
 */
import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import { getEnv } from '../lib/env';
import { tableNames } from './ddl';
import { resetDb, getDb } from './index';

// Close any open handle first so SQLite releases the file lock.
resetDb();

const file = getEnv().DATABASE_FILE;
const sqlite = new Database(file === ':memory:' ? ':memory:' : resolve(process.cwd(), file));
sqlite.pragma('foreign_keys = OFF');
for (const name of tableNames().reverse()) {
  sqlite.exec(`DROP TABLE IF EXISTS "${name}";`);
}
sqlite.close();

// Re-open through the normal path to apply DDL.
getDb();
console.log('Database reset complete.');
process.exit(0);