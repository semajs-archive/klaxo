/**
 * Apply the schema to the configured database (idempotent).
 *
 * The schema DDL is derived from `schema.ts` via `src/db/ddl.ts` and applied on
 * first connection. This script exists so `npm run db:migrate` can be invoked
 * explicitly (e.g. in CI or before a cold start).
 */
import { getDb } from './index';

getDb();
console.log('Database schema is up to date.');
process.exit(0);