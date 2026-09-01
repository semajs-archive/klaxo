import { describe, it, expect, beforeEach } from 'vitest';
import {
  getEnv,
  resetEnvCache,
  isRealAiEnabled,
  publicAiStatus,
} from '@/lib/env';

// The env module caches on first access; each test resets and mutates
// process.env to exercise specific paths.
describe('env', () => {
  beforeEach(() => {
    resetEnvCache();
    delete process.env.AI_DEV_MODE;
    delete process.env.FCC_SERVER_API_KEY;
    delete process.env.AI_MAX_RETRIES;
  });

  it('returns defaults when env is unset', () => {
    // Vitest sets NODE_ENV=test; clear it so the schema default is exercised.
    // (@types/node marks NODE_ENV read-only, hence the cast.)
    const envRecord = process.env as Record<string, string | undefined>;
    const priorNodeEnv = envRecord.NODE_ENV;
    delete envRecord.NODE_ENV;
    try {
      const env = getEnv();
      expect(env.AI_DEV_MODE).toBe(false);
      expect(env.FCC_SERVER_API_KEY).toBeUndefined();
      expect(env.NODE_ENV).toBe('development');
      expect(env.AI_MAX_RETRIES).toBe(3);
      expect(env.AI_TEMPERATURE).toBe(0.3);
    } finally {
      envRecord.NODE_ENV = priorNodeEnv;
      resetEnvCache();
    }
  });

  it('coerces AI_DEV_MODE truthy string to true', () => {
    process.env.AI_DEV_MODE = 'true';
    expect(getEnv().AI_DEV_MODE).toBe(true);
  });

  it('coerces AI_DEV_MODE falsy string to false', () => {
    process.env.AI_DEV_MODE = 'false';
    expect(getEnv().AI_DEV_MODE).toBe(false);
  });

  it('coerces integer values with bounds', () => {
    process.env.AI_MAX_RETRIES = '5';
    expect(getEnv().AI_MAX_RETRIES).toBe(5);
  });

  it('throws on out-of-bounds integer', () => {
    process.env.AI_MAX_RETRIES = '999';
    expect(() => getEnv()).toThrow(/Invalid environment configuration/);
  });

  it('isRealAiEnabled is false in dev mode even with a key', () => {
    process.env.AI_DEV_MODE = 'true';
    process.env.FCC_SERVER_API_KEY = 'nvapi-secret';
    const env = getEnv();
    expect(isRealAiEnabled(env)).toBe(false);
  });

  it('isRealAiEnabled is false without an API key', () => {
    process.env.AI_DEV_MODE = 'false';
    delete process.env.FCC_SERVER_API_KEY;
    const env = getEnv();
    expect(isRealAiEnabled(env)).toBe(false);
  });

  it('isRealAiEnabled is true with key and no dev mode', () => {
    process.env.AI_DEV_MODE = 'false';
    process.env.FCC_SERVER_API_KEY = 'nvapi-secret';
    const env = getEnv();
    expect(isRealAiEnabled(env)).toBe(true);
  });

  it('publicAiStatus never leaks the API key', () => {
    process.env.AI_DEV_MODE = 'false';
    process.env.FCC_SERVER_API_KEY = 'nvapi-super-secret-key-123';
    const status = publicAiStatus(getEnv());
    const serialized = JSON.stringify(status);
    expect(serialized).not.toContain('nvapi-');
    expect(serialized).not.toContain('sk-');
    expect(serialized).not.toContain('super-secret');
    expect(status.hasCredential).toBe(true);
  });
});