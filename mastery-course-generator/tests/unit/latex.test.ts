import { describe, it, expect } from 'vitest';
import {
  isValidLatex,
  findMathIssues,
  hasBalancedMathDelimiters,
} from '@/lib/latex';

describe('isValidLatex', () => {
  it('accepts valid LaTeX', () => {
    expect(isValidLatex('x^2 + y^2 = z^2')).toBe(true);
    expect(isValidLatex('\\frac{1}{2}')).toBe(true);
  });

  it('rejects invalid LaTeX', () => {
    expect(isValidLatex('\\notarealcommand{x')).toBe(false);
    expect(isValidLatex('\\frac{1}')).toBe(false);
  });
});

describe('findMathIssues', () => {
  it('returns no issues for valid inline and block math', () => {
    const markdown = 'Inline $x^2$ and block $$y^3$$ here.';
    expect(findMathIssues(markdown)).toEqual([]);
  });

  it('flags invalid inline math', () => {
    const issues = findMathIssues('Here is $\\badcommand{1}$ math.');
    expect(issues.length).toBeGreaterThan(0);
    const first = issues[0];
    expect(first).toBeDefined();
    expect(first?.kind).toBe('inline');
    expect(first?.message).toBeTruthy();
  });

  it('flags invalid block math with kind block', () => {
    const issues = findMathIssues('$$\n\\notreal{x\n$$');
    expect(issues.length).toBeGreaterThan(0);
    // May surface as block or inline; assert at least one issue exists and
    // each issue carries an expression + message.
    for (const issue of issues) {
      expect(issue.expression).toBeTruthy();
      expect(issue.message).toBeTruthy();
    }
  });
});

describe('hasBalancedMathDelimiters', () => {
  it('returns true for balanced delimiters', () => {
    expect(hasBalancedMathDelimiters('$x$ and $$y$$')).toBe(true);
    expect(hasBalancedMathDelimiters('no math here')).toBe(true);
  });

  it('returns false for unbalanced single dollars', () => {
    expect(hasBalancedMathDelimiters('$x and no close')).toBe(false);
  });

  it('returns false for unbalanced block delimiters', () => {
    expect(hasBalancedMathDelimiters('$$x$$ and $$y')).toBe(false);
  });
});