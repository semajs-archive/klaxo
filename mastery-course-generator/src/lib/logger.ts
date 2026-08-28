/**
 * Structured logger with mandatory secret redaction.
 *
 * Two rules are enforced here rather than left to callers:
 *   1. Anything that looks like a credential is redacted before output.
 *   2. Raw source material is only previewed when LOG_SOURCE_PREVIEWS=true,
 *      and even then only as a short truncated string.
 */
import { getEnv } from './env';

type Level = 'debug' | 'info' | 'warn' | 'error';
const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

/** Keys whose values must never be written to a log sink. */
const SECRET_KEY_RE = /(api[_-]?key|secret|token|password|authorization|bearer|credential)/i;
/** Value shapes that look like credentials even under an innocuous key. */
const SECRET_VALUE_RE = /\b(nvapi-[A-Za-z0-9_-]{8,}|sk-[A-Za-z0-9_-]{16,})\b/g;

const REDACTED = '***REDACTED***';

function redactString(s: string): string {
  return s.replace(SECRET_VALUE_RE, REDACTED);
}

/** Deep-redact a log payload. Cycles handled, depth and width bounded. */
export function redact(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (depth > 6) return '[depth-limit]';
  if (typeof value === 'string') return redactString(value);
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value as object)) return '[circular]';
  seen.add(value as object);

  if (Array.isArray(value)) return value.slice(0, 50).map((v) => redact(v, depth + 1, seen));

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SECRET_KEY_RE.test(k) ? REDACTED : redact(v, depth + 1, seen);
  }
  return out;
}

function threshold(): Level {
  try {
    return getEnv().LOG_LEVEL;
  } catch {
    return 'info';
  }
}

function emit(level: Level, message: string, context?: Record<string, unknown>): void {
  if (ORDER[level] < ORDER[threshold()]) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    message: redactString(message),
    ...(context ? { context: redact(context) as Record<string, unknown> } : {}),
  };
  const text = JSON.stringify(line);
  if (level === 'error') console.error(text);
  else if (level === 'warn') console.warn(text);
  else console.log(text);
}

export const logger = {
  debug: (m: string, c?: Record<string, unknown>) => emit('debug', m, c),
  info: (m: string, c?: Record<string, unknown>) => emit('info', m, c),
  warn: (m: string, c?: Record<string, unknown>) => emit('warn', m, c),
  error: (m: string, c?: Record<string, unknown>) => emit('error', m, c),
};

/**
 * Loggable preview of untrusted source material, honouring LOG_SOURCE_PREVIEWS.
 * Uploaded course content may be sensitive, so the default logs only a length.
 */
export function sourcePreview(text: string, max = 160): string {
  let allowed = false;
  try {
    allowed = getEnv().LOG_SOURCE_PREVIEWS;
  } catch {
    allowed = false;
  }
  if (!allowed) return `[${text.length} chars withheld]`;
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length <= max ? flat : `${flat.slice(0, max)}...`;
}
