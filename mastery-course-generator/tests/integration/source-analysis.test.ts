import { describe, it, expect, beforeAll, afterAll } from 'vitest';

process.env.AI_DEV_MODE = 'true';
process.env.DATABASE_FILE = ':memory:';

import { resetDb, getDb } from '@/db';
import { createUser, createCourse } from '@/db/repo';
import { ingestPrompt } from '@/services/ingestion';
import {
  analyzeSources,
  detectSourceConflicts,
  type SourceFragmentEvidence,
} from '@/services/source-analysis';

const userId = 'usr_source_user';
const courseId = 'crs_source_course';

beforeAll(() => {
  resetDb();
  getDb();
  createUser({ id: userId, email: 'source@test.com' });
  createCourse({ id: courseId, userId, title: 'Source Course' });
});

afterAll(() => {
  resetDb();
});

describe('analyzeSources (mock AI)', () => {
  it('produces a knowledge package with fragments and provenance', async () => {
    const doc = await ingestPrompt(courseId, 'Teach the fundamentals of linear algebra.');
    const result = await analyzeSources({ courseId, documentIds: [doc.documentId] });

    expect(result.knowledgePackageId).toBeTruthy();
    expect(result.analysis.title).toBeTruthy();
    expect(result.provider).toBe('mock');

    // Fragments were extracted from the prompt text.
    expect(result.fragments.length).toBeGreaterThan(0);
    // At least one fragment is a paragraph.
    expect(result.fragments.some((f) => f.kind === 'paragraph')).toBe(true);
  });

  it('rejects analysis when no documents are provided', async () => {
    await expect(
      analyzeSources({ courseId, documentIds: [] }),
    ).rejects.toThrow(/no source documents/i);
  });
});

describe('detectSourceConflicts', () => {
  it('flags unit-count conflicts between sources', () => {
    const fragments: SourceFragmentEvidence[] = [
      {
        id: 'frag_1',
        documentId: 'doc_a',
        kind: 'paragraph',
        text: 'This course has 5 units.',
        uncertain: false,
      },
      {
        id: 'frag_2',
        documentId: 'doc_b',
        kind: 'paragraph',
        text: 'This course has 7 units.',
        uncertain: false,
      },
    ];
    const conflicts = detectSourceConflicts(fragments);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0]?.description).toMatch(/disagree/i);
  });

  it('reports no conflict when unit counts agree', () => {
    const fragments: SourceFragmentEvidence[] = [
      {
        id: 'frag_1',
        documentId: 'doc_a',
        kind: 'paragraph',
        text: 'This course has 5 units.',
        uncertain: false,
      },
      {
        id: 'frag_2',
        documentId: 'doc_b',
        kind: 'paragraph',
        text: 'This course has 5 units.',
        uncertain: false,
      },
    ];
    expect(detectSourceConflicts(fragments)).toEqual([]);
  });
});