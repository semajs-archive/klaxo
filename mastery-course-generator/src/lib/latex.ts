/**
 * LaTeX validation for generated content.
 *
 * A malformed equation must never crash a lesson page. We validate generated
 * math up front, record the problem, and let the renderer fall back to showing
 * the raw source instead of throwing.
 */
import katex from 'katex';

export interface MathIssue {
  expression: string;
  message: string;
  /** 'inline' for $...$, 'block' for $$...$$ */
  kind: 'inline' | 'block';
}

const BLOCK_RE = /\$\$([\s\S]+?)\$\$/g;
const INLINE_RE = /(?<!\$)\$(?!\$)((?:\.|[^$])+?)\$(?!\$)/g;

/** True when the expression compiles under KaTeX. */
export function isValidLatex(expression: string, displayMode = false): boolean {
  try {
    katex.renderToString(expression, { displayMode, throwOnError: true, strict: false });
    return true;
  } catch {
    return false;
  }
}

/**
 * Find every math expression in a Markdown string that KaTeX cannot compile.
 * Used by the QA stage to flag invalid equations before publishing.
 */
export function findMathIssues(markdown: string): MathIssue[] {
  const issues: MathIssue[] = [];

  const check = (expr: string, kind: MathIssue['kind']) => {
    const trimmed = expr.trim();
    if (!trimmed) return;
    try {
      katex.renderToString(trimmed, {
        displayMode: kind === 'block',
        throwOnError: true,
        strict: false,
      });
    } catch (err) {
      issues.push({
        expression: trimmed.slice(0, 200),
        message: err instanceof Error ? err.message : 'Unknown KaTeX error',
        kind,
      });
    }
  };

  // Block math first, then remove it so inline scanning cannot re-match it.
  const withoutBlocks = markdown.replace(BLOCK_RE, (_m, expr: string) => {
    check(expr, 'block');
    return ' ';
  });
  for (const m of withoutBlocks.matchAll(INLINE_RE)) {
    if (m[1]) check(m[1], 'inline');
  }

  return issues;
}

/** Unbalanced delimiters are a common model failure; detect them cheaply. */
export function hasBalancedMathDelimiters(markdown: string): boolean {
  const blocks = (markdown.match(/\$\$/g) ?? []).length;
  if (blocks % 2 !== 0) return false;
  const singles = (markdown.replace(/\$\$/g, '').match(/(?<!\$)\$/g) ?? []).length;
  return singles % 2 === 0;
}
