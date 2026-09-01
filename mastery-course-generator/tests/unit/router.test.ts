import { describe, it, expect } from 'vitest';
import { parseJsonSafe, stripReasoning } from '@/ai/router';

describe('stripReasoning', () => {
  it('leaves a plain reply alone', () => {
    expect(stripReasoning('{"a":1}')).toBe('{"a":1}');
  });

  it('removes a <think> block and keeps the answer', () => {
    const reply = '<think>Let me plan this out.</think>\n{"a":1}';
    expect(stripReasoning(reply)).toBe('{"a":1}');
  });

  it('keeps only what follows the last closing tag', () => {
    const reply = '<think>one</think> noise <think>two</think>{"a":1}';
    expect(stripReasoning(reply)).toBe('{"a":1}');
  });

  it('handles a stray closing tag with no opening tag', () => {
    expect(stripReasoning('deliberating…</think>{"a":1}')).toBe('{"a":1}');
  });

  it('drops an unterminated block, because the answer never arrived', () => {
    expect(stripReasoning('<think>still thinking about {units:')).toBe('');
  });

  it('recognises <reasoning> and mixed case', () => {
    expect(stripReasoning('<Reasoning>hm</REASONING>{"a":1}')).toBe('{"a":1}');
  });
});

describe('parseJsonSafe', () => {
  it('parses a bare object', () => {
    expect(parseJsonSafe('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses a bare array', () => {
    expect(parseJsonSafe('[1,2]')).toEqual([1, 2]);
  });

  it('parses a fenced block', () => {
    expect(parseJsonSafe('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('parses a fenced block with prose on both sides', () => {
    const reply = 'Here is the blueprint:\n```json\n{"a":1}\n```\nLet me know if you want changes.';
    expect(parseJsonSafe(reply)).toEqual({ a: 1 });
  });

  it('ignores the brace sketch inside a reasoning block', () => {
    // The exact shape that broke curriculum planning: the model talks itself
    // through the schema, and the sketch is not valid JSON.
    const reply = [
      '<think>',
      'The user wants a blueprint. The shape is',
      '{',
      'title, description, units[...]',
      '}',
      'so I will fill that in.',
      '</think>',
      '{"title":"Course","units":[]}',
    ].join('\n');
    expect(parseJsonSafe(reply)).toEqual({ title: 'Course', units: [] });
  });

  it('is not confused by prose containing a brace after the JSON', () => {
    const reply = '{"a":1}\n\nNote: the {units} array is empty on purpose.';
    expect(parseJsonSafe(reply)).toEqual({ a: 1 });
  });

  it('does not mistake a brace inside a string for a boundary', () => {
    expect(parseJsonSafe('{"note":"use {curly} braces"}')).toEqual({
      note: 'use {curly} braces',
    });
  });

  it('handles escaped quotes inside strings', () => {
    expect(parseJsonSafe('prefix {"note":"say \\"hi\\""} suffix')).toEqual({
      note: 'say "hi"',
    });
  });

  it('reports what the model actually replied when nothing parses', () => {
    expect(() => parseJsonSafe('I cannot help with that request.')).toThrow(
      /Model replied: I cannot help with that request\./,
    );
  });

  it('reports an empty reply as empty', () => {
    expect(() => parseJsonSafe('   ')).toThrow(/\(empty\)/);
  });
});
