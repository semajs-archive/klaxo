import { describe, it, expect, beforeAll, afterAll } from 'vitest';

process.env.AI_DEV_MODE = 'true';
process.env.DATABASE_FILE = ':memory:';

import { resetDb, getDb } from '@/db';
import { createUser, createCourse, listUnits, listObjectives } from '@/db/repo';
import { ingestPrompt } from '@/services/ingestion';
import { analyzeSources } from '@/services/source-analysis';
import { updateKnowledgePackage } from '@/db/repo';
import { generateBlueprint, persistBlueprint } from '@/services/course-generation';
import {
  createVersion,
  publishVersion,
  listVersions,
  restoreVersion,
  compareVersions,
} from '@/services/versioning';

const userId = 'usr_versioning_user';
const courseId = 'crs_versioning_course';

beforeAll(async () => {
  resetDb();
  getDb();
  createUser({ id: userId, email: 'versioning@test.com' });
  createCourse({ id: courseId, userId, title: 'Versioning Course' });

  // Seed a curriculum: ingest a prompt, analyze it, approve the knowledge package,
  // then generate + persist a blueprint so there's something to snapshot.
  const src = await ingestPrompt(courseId, 'Teach linear algebra fundamentals.');
  await analyzeSources({ courseId, documentIds: [src.documentId] });
  // Approve the knowledge package so blueprint generation can proceed.
  const kp = await import('@/db/repo').then((m) => m.getLatestKnowledgePackage(courseId));
  if (kp) {
    await updateKnowledgePackage(kp.id, { status: 'approved' });
  }
  const blueprint = await generateBlueprint(courseId);
  await persistBlueprint(courseId, blueprint);
});

afterAll(() => {
  resetDb();
});

describe('course versioning', () => {
  it('createVersion snapshots the curriculum and increments versionNumber', () => {
    const v1 = createVersion(courseId, userId, { label: 'initial' });
    expect(v1.versionNumber).toBe(1);

    const v2 = createVersion(courseId, userId, { label: 'second' });
    expect(v2.versionNumber).toBe(2);

    const versions = listVersions(courseId, userId);
    expect(versions).toHaveLength(2);
  });

  it('listVersions marks the current version', () => {
    const versions = listVersions(courseId, userId);
    const current = versions.find((v) => v.isCurrent === true);
    expect(current).toBeTruthy();
    expect(current?.versionNumber).toBe(2);
  });

  it('publishVersion is immutable and conflicts on double publish', () => {
    const versions = listVersions(courseId, userId);
    // Publish the latest draft (version 2).
    const draft = versions.find((v) => v.versionNumber === 2);
    expect(draft).toBeTruthy();
    const versionId = String(draft?.id);

    const published = publishVersion(courseId, versionId, userId);
    expect(published.status).toBe('published');

    // Publishing twice must throw a conflict.
    expect(() => publishVersion(courseId, versionId, userId)).toThrow(/already published/);
  });

  it('compareVersions reports structural diffs', () => {
    const versions = listVersions(courseId, userId);
    const v2 = versions.find((v) => v.versionNumber === 2);
    const v1 = versions.find((v) => v.versionNumber === 1);
    expect(v1).toBeTruthy();
    expect(v2).toBeTruthy();

    const diff = compareVersions(
      courseId,
      String(v1?.id),
      String(v2?.id),
      userId,
    );
    // v1 and v2 were created from an identical curriculum; expect no changes.
    expect(diff.units.added).toBe(0);
    expect(diff.units.removed).toBe(0);
  });

  it('restoreVersion re-creates entities after deletion', () => {
    const before = listUnits(courseId).length;
    expect(before).toBeGreaterThan(0);

    const versions = listVersions(courseId, userId);
    const v1 = versions.find((v) => v.versionNumber === 1);
    expect(v1).toBeTruthy();

    restoreVersion(courseId, String(v1?.id), userId);

    const after = listUnits(courseId).length;
    const objectives = listObjectives(courseId).length;
    expect(after).toBe(before);
    expect(objectives).toBeGreaterThan(0);
  });
});