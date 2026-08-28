/**
 * Integration test: full course generation pipeline via mock AI provider.
 *
 * Verifies the end-to-end flow against a real in-memory SQLite database:
 *   create course → ingest source → analyze → blueprint → generate → QA.
 *
 * Uses AI_DEV_MODE=true (mock provider) with deterministic fixtures, and
 * asserts on ACTUAL persisted database state, not just HTTP 200.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';

// Force dev mode BEFORE importing anything that reads env.
process.env.AI_DEV_MODE = 'true';
process.env.FCC_SERVER_API_KEY = '';
process.env.DATABASE_FILE = ':memory:';

import { resetDb, getDb } from '@/db';
import { createUser } from '@/db/repo';
import { ingestPrompt } from '@/services/ingestion';
import { analyzeSource } from '@/services/source-analysis';
import { generateBlueprint, persistBlueprint } from '@/services/course-generation';
import { runQa } from '@/services/qa';
import { executeGenerateCourseJob } from '@/pipeline/orchestrator';
import { listUnits, listObjectives, listLessons, listAssessments, listQuestions, createCourse, createGenerationJob } from '@/db/repo';

describe('Mastery course generation pipeline (mock AI)', () => {
  beforeAll(async () => {
    // Ensure a fresh in-memory database is initialised.
    resetDb();
    getDb();
  });

  afterAll(() => {
    resetDb();
  });

  it('runs the complete pipeline and persists actual curriculum data', async () => {
    // 1. User + course.
    const userId = `usr_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
    createUser({ id: userId, email: `test-${Date.now()}@example.com` });

    const courseId = `crs_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
    createCourse({
      id: courseId,
      userId,
      title: 'Test Course',
      description: 'An integration test course',
      subjectDomain: 'general',
    });

    // 2. Ingest a prompt source.
    const src = await ingestPrompt(courseId, 'Teach the fundamentals of linear algebra with a focus on solving systems of equations.');

    // 3. Analyze the source into a knowledge package.
    const analysis = await analyzeSource({ courseId, documentId: src.documentId });
    expect(analysis.knowledgePackageId).toBeTruthy();
    expect(analysis.analysis.title).toBeTruthy();
    expect(analysis).toHaveProperty('provider', 'mock');

    // 4. Generate + persist blueprint.
    const blueprint = await generateBlueprint(courseId);
    expect(blueprint.units.length).toBeGreaterThan(0);
    await persistBlueprint(courseId, blueprint);

    const units = listUnits(courseId);
    const objectives = listObjectives(courseId);
    expect(units.length).toBeGreaterThan(0);
    expect(objectives.length).toBeGreaterThan(0);

    // 5. Generate the full course (lessons, practice, assessments, QA).
    const jobId = `job_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
    createGenerationJob({ id: jobId, courseId, userId, kind: 'GENERATE_COURSE' });
    await executeGenerateCourseJob(jobId, courseId);

    const lessons = listLessons(courseId);
    const assessments = listAssessments(courseId);
    const questions = listQuestions(courseId);

    expect(lessons.length).toBeGreaterThan(0);
    expect(assessments.length).toBeGreaterThan(0);
    expect(questions.length).toBeGreaterThan(0);

    // 6. QA.
    const qa = await runQa(courseId, jobId, 1);
    expect(qa.totalChecks).toBeGreaterThan(0);
  });
});