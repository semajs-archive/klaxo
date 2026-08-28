/**
 * Fixed-window, in-process rate limiter for API routes.
 *
 * Scope: abuse protection for a single-node deployment. A multi-node
 * deployment should back this with Redis; the interface stays the same.
 */
import { getEnv } from './env';

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();
const WINDOW_MS = 60_000;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

/** Consume one unit for `key`. Returns whether the caller may proceed. */
export function consume(key: string, limit = getEnv().RATE_LIMIT_PER_MINUTE): RateLimitResult {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    const fresh: Window = { count: 1, resetAt: now + WINDOW_MS };
    windows.set(key, fresh);
    return { ok: true, remaining: limit - 1, resetAt: fresh.resetAt, limit };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  return { ok: existing.count <= limit, remaining, resetAt: existing.resetAt, limit };
}

/** Derive a stable-enough client key from request headers. */
export function clientKey(req: Request, suffix = ''): string {
  const h = req.headers;
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'local';
  return `${ip}:${suffix}`;
}

/** Test/maintenance helper. */
export function resetRateLimits(): void {
  windows.clear();
}

/** Drop expired windows so the map cannot grow without bound. */
export function pruneRateLimits(now = Date.now()): void {
  for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
}
