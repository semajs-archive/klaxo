import { getTableConfig } from 'drizzle-orm/sqlite-core';
import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

const t = sqliteTable('demo', {
  id: text('id').primaryKey(),
  n: integer('n').notNull().default(5),
  r: real('r'),
  d: integer('d').notNull().$defaultFn(() => Date.now()),
  ref: text('ref').references(() => t.id),
}, (tt) => [index('demo_n_idx').on(tt.n), uniqueIndex('demo_r_uq').on(tt.r)]);

const cfg = getTableConfig(t);
console.log('name:', cfg.name);
for (const c of cfg.columns) {
  console.log(JSON.stringify({
    name: c.name, type: c.getSQLType?.() ?? c.dataType, notNull: c.notNull,
    primary: c.primary, hasDefault: c.hasDefault,
    default: typeof c.default, defaultFn: typeof c.defaultFn,
  }));
}
console.log('indexes:', cfg.indexes.map(i => {
  const b = i.config ?? i;
  return { name: b.name, unique: b.unique, cols: (b.columns||[]).map(c=>c.name) };
}));
console.log('fks:', cfg.foreignKeys.length);
for (const fk of cfg.foreignKeys) {
  const r = fk.reference();
  console.log('  ', r.columns.map(c=>c.name), '->', getTableConfig(r.foreignTable).name, r.foreignColumns.map(c=>c.name));
}
