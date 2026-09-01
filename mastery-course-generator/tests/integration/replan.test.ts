import { describe, it, expect, beforeAll } from 'vitest';

process.env.AI_DEV_MODE = 'true';
process.env.DATABASE_FILE = ':memory:';

import { resetDb, getDb } from '@/db';
import {
  createUser,
  createCourse,
  createMasteryRecord,
  listMasteryRecords,
  listObjectives,
  listUnits,
  updateKnowledgePackage,
} from '@/db/repo';
import { ingestPrompt } from '@/services/ingestion';
import { analyzeSources } from '@/services/source-analysis';
import { generateBlueprint, persistBlueprint } from '@/services/course-generation';
import { mergeBlueprint, objectiveKey } from '@/services/replan';
import type { CurriculumBlueprint } from '@/ai/types';

const userId = 'usr_replan_user';
const courseId = 'crs_replan_course';

/** A blueprint built by hand, so the test controls exactly what changes. */
function blueprintOf(objectiveStatements: string[][]): CurriculumBlueprint {
  return {
    title: 'Replan Course',
    description: '',
    intendedLearner: '',
    assumedKnowledge: '',
    units: objectiveStatements.map((statements, i) => ({
      title: `Unit ${i + 1}`,
      classification: 'REQUIRED' as const,
      topics: [],
      objectives: statements.map((statement) => ({
        statement,
        category: 'skill',
        difficulty: 3 as const,
        importance: 3 as const,
        classification: 'REQUIRED' as const,
        prerequisites: [],
      })),
    })),
    prerequisites: [],
  } as unknown as CurriculumBlueprint;
}

beforeAll(async () => {
  resetDb();
  getDb();
  createUser({ id: userId, email: 'replan@test.com' });
  createCourse({ id: courseId, userId, title: 'Replan Course' });

  const src = await ingestPrompt(courseId, 'Teach the basics of network security.');
  await analyzeSources({ courseId, documentIds: [src.documentId] });
  const kp = await import('@/db/repo').then((m) => m.getLatestKnowledgePackage(courseId));
  if (kp) await updateKnowledgePackage(kp.id, { status: 'approved' });

  const blueprint = await generateBlueprint(courseId);
  await persistBlueprint(courseId, blueprint);
});

describe('objectiveKey', () => {
  it('treats casing, spacing and a trailing stop as the same objective', () => {
    expect(objectiveKey('Explain  TLS handshakes.')).toBe(objectiveKey('explain tls handshakes'));
  });

  it('does not collapse genuinely different statements', () => {
    expect(objectiveKey('Explain TLS handshakes')).not.toBe(objectiveKey('Explain TCP handshakes'));
  });
});

describe('mergeBlueprint', () => {
  it('keeps matched objectives, adds new ones, removes the rest — and does not duplicate units', async () => {
    const before = listObjectives(courseId);
    expect(before.length).toBeGreaterThan(0);

    const survivor = before[0]!;
    const doomed = before[before.length - 1]!;

    // Progress recorded against the objective that survives.
    createMasteryRecord({
      id: 'mas_replan_1',
      courseId,
      userId,
      objectiveId: survivor.id,
      state: 'MASTERED',
    });

    const unitsBefore = listUnits(courseId).length;

    const summary = mergeBlueprint(
      courseId,
      blueprintOf([[survivor.statement, 'A brand new objective about firewalls']]),
    );

    expect(summary.kept).toBe(1);
    expect(summary.added).toBe(1);
    expect(summary.removed).toBe(before.length - 1);
    expect(summary.addedObjectiveIds).toHaveLength(1);

    const after = listObjectives(courseId);
    expect(after).toHaveLength(2);

    // The survivor is the SAME row — that is what carries the progress.
    const stillThere = after.find((o) => o.id === survivor.id);
    expect(stillThere).toBeDefined();
    expect(after.find((o) => o.id === doomed.id)).toBeUndefined();

    const mastery = listMasteryRecords(courseId, userId);
    expect(mastery.find((m) => m.objectiveId === survivor.id)?.state).toBe('MASTERED');

    // The old plan is replaced, not stacked on top of.
    expect(listUnits(courseId)).toHaveLength(1);
    expect(unitsBefore).toBeGreaterThan(0);
  });

  it('re-parents a surviving objective onto the new unit', () => {
    const objectives = listObjectives(courseId);
    const units = listUnits(courseId);
    for (const objective of objectives) {
      expect(units.some((u) => u.id === objective.unitId)).toBe(true);
    }
  });
});
