import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('imports schema without error', async () => {
    const { schema } = await import('@/db');
    expect(schema).toBeTruthy();
  });

  it('gets db and creates a user', async () => {
    const { resetDb } = await import('@/db');
    resetDb();
    const { createUser } = await import('@/db/repo');
    const u = createUser({ id: 'usr_test', email: 'smoke@test.com' });
    expect(u.id).toBe('usr_test');
  });
});