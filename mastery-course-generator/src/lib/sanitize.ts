/**
 * Sanitisation for AI-generated and user-edited rich content.
 *
 * Generated Markdown is rendered by react-markdown, which does NOT pass raw
 * HTML through unless `rehype-raw` is enabled (it is not). This module is the
 * second layer of defence: it strips constructs that could still be dangerous
 * if content were ever rendered by a different path, and it keeps generated
 * text from smuggling in markup.
 */

/** Strip HTML tags, script/style bodies, and javascript: URLs from text. */
export function stripHtml(input: string): string {
  return input
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/javascript\s*:/gi, 'blocked:')
    .replace(/data\s*:\s*text\/html/gi, 'blocked:');
}

/**
 * Sanitise a Markdown string produced by the model or edited by a user.
 * Markdown structure (headings, lists, tables, math, code fences) is preserved;
 * embedded HTML and dangerous URL schemes are removed.
 */
export function sanitizeMarkdown(input: string, maxLength = 60_000): string {
  let out = input.slice(0, maxLength);
  // Neutralise raw HTML while leaving Markdown intact.
  out = out
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<iframe\b[\s\S]*?<\/iframe\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed|link|meta|base|form)\b[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, 'blocked:')
    .replace(/vbscript\s*:/gi, 'blocked:')
    .replace(/data\s*:\s*text\/html/gi, 'blocked:');
  return out.trim();
}

/** Collapse whitespace and clamp a short single-line field (titles, labels). */
export function sanitizeLine(input: string, maxLength = 300): string {
  return stripHtml(input).replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

/** Recursively sanitise every string in a plain JSON-ish structure. */
export function sanitizeDeep<T>(value: T, depth = 0): T {
  if (depth > 12) return value;
  if (typeof value === 'string') return sanitizeMarkdown(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => sanitizeDeep(v, depth + 1)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeDeep(v, depth + 1);
    }
    return out as unknown as T;
  }
  return value;
}
