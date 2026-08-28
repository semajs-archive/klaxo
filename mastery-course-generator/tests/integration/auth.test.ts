import { describe, it, expect } from 'vitest';

// Auth reads APP_SECRET from env on import; ensure a known secret is set
// before importing so signature is deterministic.
process.env.APP_SECRET = 'test-secret-value-not-a-real-secret';

import { encodeSession, decodeSession } from '@/lib/auth';

describe('session encode/decode', () => {
  it('round-trips a valid session', () => {
    const token = encodeSession('usr_123');
    const decoded = decodeSession(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe('usr_123');
  });

  it('returns null for a tampered signature', () => {
    const token = encodeSession('usr_123');
    // Flip a character in the signature portion.
    const parts = token.split('.');
    const sig = parts[2];
    const tampered = `${parts[0]}.${parts[1]}.${sig!.slice(0, -1)}${sig!.endsWith('A') ? 'B' : 'A'}`;
    expect(decodeSession(tampered)).toBeNull();
  });

  it('returns null for a tampered payload (different userId)', () => {
    const token = encodeSession('usr_123');
    const parts = token.split('.');
    const forged = `usr_999.${parts[1]}.${parts[2]}`;
    expect(decodeSession(forged)).toBeNull();
  });

  it('returns null for an expired session', () => {
    const oldIssuedAt = Date.now() - 1000 * 60 * 60 * 24 * 31; // 31 days ago
    const token = encodeSession('usr_123', oldIssuedAt);
    expect(decodeSession(token)).toBeNull();
  });

  it('returns null for malformed tokens', () => {
    expect(decodeSession(undefined)).toBeNull();
    expect(decodeSession('')).toBeNull();
    expect(decodeSession('only.one.part.extra')).toBeNull();
  });
});