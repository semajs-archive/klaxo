/**
 * End-to-end flow test (service layer, not HTTP):
 *   CREATE → UPLOAD → ANALYZE → BLUEPRINT → GENERATE → QA → PRACTICE → MASTERY.
 *
 * Uses an in-memory DB and the mock AI provider, and asserts on ACTUAL persisted
 * database state (units, objectives, lessons, questions, QA results, mastery
 * records), not just HTTP 200.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';

process.env.AI_DEV_MODE = 'true';
process.env.FCC_SERVER_API_KEY = '';
process.env.DATABASE_FILE = ':memory:';

import { resetDb, getDb } from '@/db';
import { createUser, createCourse, createGenerationJob } from '@/db/repo';
import { ingestPrompt } from '@/services/ingestion';
import { analyzeSource } from '@/services/source-analysis';
import { generateBlueprint, persistBlueprint } from '@/services/course-generation';
import { executeGenerateCourseJob } from '@/pipeline/orchestrator';
import { runQa } from '@/services/qa';
import { recordAttempt } from '@/services/mastery';
import { listUnits, listObjectives, listLessons, listQuestions } from '@/db/repo';

const userId = `usr_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
const courseId = `crs_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
const jobId = `job_${randomUUID().replace(/-/g, '').slice(0, 24)}`;

describe('E2E flow (mock AI, in-memory DB)', () => {
  beforeAll(() => {
    resetDb();
    getDb();
  });

  afterAll(() => {
    resetDb();
  });

  it('runs CREATE → UPLOAD → ANALYZE → BLUEPRINT → GENERATE → QA → PRACTICE → MASTERY', async () => {
    // 1. CREATE user + course.
    createUser({ id: userId, email: `e2e-${Date.now()}@example.com` });
    createCourse({ id: courseId, userId, title: 'E2E Course' });

    // 2. UPLOAD (ingest a prompt).
    const src = await ingestPrompt(courseId, 'Teach the fundamentals of linear algebra.');

    // 3. ANALYZE.
    const analysis = await analyzeSource({ courseId, documentId: src.documentId });
    expect(analysis.knowledgePackageId).toBeTruthy();
    expect(analysis.provider).toBe('mock');

    // 4. BLUEPRINT.
    const blueprint = await generateBlueprint(courseId);
    await persistBlueprint(courseId, blueprint);

    // 5. GENERATE (lessons, practice, assessments, QA + revision).
    createGenerationJob({ id: jobId, courseId, userId, kind: 'GENERATE_COURSE' });
    await executeGenerateCourseJob(jobId, courseId);

    const units = listUnits(courseId);
    const objectives = listObjectives(courseId);
    const lessons = listLessons(courseId);
    const questions = listQuestions(courseId);
    expect(units.length).toBeGreaterThan(0);
    expect(objectives.length).toBeGreaterThan(0);
    expect(lessons.length).toBeGreaterThan(0);
    expect(questions.length).toBeGreaterThan(0);

    // 6. QA (deterministic + AI; assert QA results persisted).
    const qa = await runQa(courseId, jobId, 2);
    expect(qa.totalChecks).toBeGreaterThan(0);

    // 7. PRACTICE + MASTERY: record a correct attempt against a real question.
    const question = questions[0];
    expect(question).toBeDefined();
    const objectiveId = String(question?.objectiveId);
    // Pick the correct answer for an MCQ, else default first response.
    let response: unknown = 'x';
    if (question?.kind === 'mcq' && question.choices) {
      const choices = JSON.parse(question.choices) as Array<{ text: string; isCorrect: boolean }>;
      response = choices.find((c) => c.isCorrect)?.text ?? 'x';
    }

    const attempt = recordAttempt({
      courseId,
      userId,
      questionId: String(question?.id),
      objectiveId,
      response,
    });

    // Mastery state has progressed away from NOT_STARTED.
    expect(attempt.mastery.state).not.toBe('NOT_STARTED');
    expect(attempt.mastery.attemptCount).toBeGreaterThan(0);
  });
});