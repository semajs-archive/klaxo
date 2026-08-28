/**
 * DDL emitted directly from the Drizzle schema.
 *
 * Rather than maintaining hand-written SQL alongside `schema.ts` (two sources of
 * truth that inevitably drift), the CREATE TABLE / CREATE INDEX statements are
 * derived from Drizzle's own table metadata. Adding a column to `schema.ts` is
 * therefore the only step needed, and `tests/unit/ddl.test.ts` asserts that
 * every declared column really does end up in the physical table.
 */
import { getTableConfig } from 'drizzle-orm/sqlite-core';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { ALL_TABLES } from './schema';

function quoteDefault(value: unknown): string {
  if (value === null) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? '1' : '0';
  return `'${String(value).replace(/'/g, "''")}'`;
}

/** CREATE TABLE for a single Drizzle table, including FK clauses. */
export function tableDdl(table: SQLiteTable): string {
  const cfg = getTableConfig(table);
  const lines: string[] = [];

  for (const col of cfg.columns) {
    const parts = [`"${col.name}"`, col.getSQLType().toUpperCase()];
    if (col.primary) parts.push('PRIMARY KEY');
    if (col.notNull && !col.primary) parts.push('NOT NULL');
    // `$defaultFn` defaults are applied by Drizzle at insert time, so they
    // intentionally do not become SQL defaults.
    if (col.hasDefault && col.default !== undefined) {
      parts.push(`DEFAULT ${quoteDefault(col.default)}`);
    }
    lines.push(`  ${parts.join(' ')}`);
  }

  for (const fk of cfg.foreignKeys) {
    const ref = fk.reference();
    const local = ref.columns.map((c) => `"${c.name}"`).join(', ');
    const foreignTable = getTableConfig(ref.foreignTable).name;
    const foreign = ref.foreignColumns.map((c) => `"${c.name}"`).join(', ');
    lines.push(`  FOREIGN KEY (${local}) REFERENCES "${foreignTable}" (${foreign})`);
  }

  return `CREATE TABLE IF NOT EXISTS "${cfg.name}" (\n${lines.join(',\n')}\n);`;
}

/** CREATE INDEX statements declared on a table. */
export function indexDdl(table: SQLiteTable): string[] {
  const cfg = getTableConfig(table);
  const out: string[] = [];
  for (const idx of cfg.indexes) {
    const b = idx.config;
    const cols = (b.columns ?? [])
      .map((c) => columnName(c))
      .filter((c): c is string => c !== null);
    if (cols.length === 0) continue;
    out.push(
      `CREATE ${b.unique ? 'UNIQUE ' : ''}INDEX IF NOT EXISTS "${b.name}" ` +
        `ON "${cfg.name}" (${cols.join(', ')});`,
    );
  }
  return out;
}

/**
 * Resolve a column name from an index column, which Drizzle types as either a
 * {@link Column} (with `.name`) or a raw {@link SQL} expression (e.g. a
 * functional index). For raw expressions we fall back to `null` so the index is
 * skipped rather than emitting invalid DDL.
 */
function columnName(c: unknown): string | null {
  if (c && typeof c === 'object' && 'name' in c && typeof (c as { name?: unknown }).name === 'string') {
    return (c as { name: string }).name;
  }
  return null;
}

/** Full schema DDL, tables first then indexes. */
export function schemaDdl(): string[] {
  const statements: string[] = [];
  for (const t of ALL_TABLES) statements.push(tableDdl(t as unknown as SQLiteTable));
  for (const t of ALL_TABLES) statements.push(...indexDdl(t as unknown as SQLiteTable));
  return statements;
}

/** Physical table names in creation order. */
export function tableNames(): string[] {
  return ALL_TABLES.map((t) => getTableConfig(t as unknown as SQLiteTable).name);
}
