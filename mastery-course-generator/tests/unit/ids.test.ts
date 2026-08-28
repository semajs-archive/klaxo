import { describe, it, expect } from 'vitest';
import { newId, contentHash, slugify } from '@/lib/ids';

describe('newId', () => {
  it('prefixes ids with the given tag', () => {
    expect(newId('usr')).toMatch(/^usr_[0-9a-f]{24}$/);
    expect(newId('crs')).toMatch(/^crs_[0-9a-f]{24}$/);
    expect(newId('obj')).toMatch(/^obj_[0-9a-f]{24}$/);
  });

  it('produces unique ids across calls', () => {
    const a = newId('unt');
    const b = newId('unt');
    expect(a).not.toBe(b);
  });
});

describe('contentHash', () => {
  it('is stable for identical inputs', () => {
    expect(contentHash('a', 'b')).toBe(contentHash('a', 'b'));
  });

  it('differs for different inputs', () => {
    expect(contentHash('a', 'b')).not.toBe(contentHash('a', 'c'));
  });

  it('is order-sensitive', () => {
    expect(contentHash('a', 'b')).not.toBe(contentHash('b', 'a'));
  });

  it('returns a 32-char hex digest', () => {
    expect(contentHash('hello')).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe('slugify', () => {
  it('lowercases and replaces non-alphanumerics with dashes', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('strips leading and trailing dashes', () => {
    expect(slugify('  --Hello World!!  ')).toBe('hello-world');
  });

  it('handles empty input with a fallback', () => {
    expect(slugify('')).toBe('item');
    expect(slugify('!!!')).toBe('item');
  });

  it('removes diacritics', () => {
    expect(slugify('café résumé')).toBe('cafe-resume');
  });

  it('clamps to max length', () => {
    const long = 'a'.repeat(100);
    expect(slugify(long)).toHaveLength(60);
  });
});