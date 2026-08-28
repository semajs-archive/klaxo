import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';

process.env.AI_DEV_MODE = 'true';
process.env.DATABASE_FILE = ':memory:';

import { resetDb, getDb } from '@/db';
import {
  createUser,
  createCourse,
  createUnit,
  createObjective,
  createQuestion,
} from '@/db/repo';
import {
  computeNextReview,
  gradeQuestion,
  recordAttempt,
  recommendForState,
} from '@/services/mastery';

function uid(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
}

// Fixed, deterministic ids so recordAttempt ownership checks are stable.
const userId = 'usr_mastery_user';
const courseId = 'crs_mastery_course';
const unitId = 'unt_mastery_unit';
const objectiveId = 'obj_mastery_objective';

function seed(): void {
  createUser({ id: userId, email: 'mastery@test.com' });
  createCourse({ id: courseId, userId, title: 'Mastery Course' });
  createUnit({ id: unitId, courseId, ordinal: 0, title: 'Unit One' });
  createObjective({
    id: objectiveId,
    courseId,
    unitId,
    ordinal: 0,
    code: 'U1.O1',
    title: 'Objective',
    statement: 'Define foundational terms accurately.',
  });
}

describe('computeNextReview', () => {
  it('follows the spaced-repetition interval table', () => {
    expect(computeNextReview(0)).toBe(1);
    expect(computeNextReview(1)).toBe(2);
    expect(computeNextReview(2)).toBe(4);
    expect(computeNextReview(3)).toBe(7);
    expect(computeNextReview(4)).toBe(14);
    expect(computeNextReview(5)).toBe(30);
  });

  it('caps at 30 days for large evidence counts', () => {
    expect(computeNextReview(100)).toBe(30);
  });

  it('clamps negative evidence counts to the first interval', () => {
    expect(computeNextReview(-5)).toBe(1);
  });
});

describe('gradeQuestion', () => {
  it('grades a correct mcq by choice id', () => {
    const q = {
      kind: 'mcq',
      choices: JSON.stringify([
        { id: 'c1', text: 'Right', isCorrect: true },
        { id: 'c2', text: 'Wrong', isCorrect: false },
      ]),
    };
    expect(gradeQuestion(q, 'c1').isCorrect).toBe(true);
    expect(gradeQuestion(q, 'c2').isCorrect).toBe(false);
  });

  it('grades mcq by indexed answer fallback', () => {
    const q = {
      kind: 'mcq',
      choices: JSON.stringify([
        { index: 0, text: 'Right', isCorrect: true },
        { index: 1, text: 'Wrong', isCorrect: false },
      ]),
    };
    expect(gradeQuestion(q, '0').isCorrect).toBe(true);
  });

  it('grades numeric within tolerance', () => {
    const q = { kind: 'numeric', answerKey: JSON.stringify({ correct: 3.14159, tolerance: 0.01 }) };
    expect(gradeQuestion(q, 3.14).isCorrect).toBe(true);
    expect(gradeQuestion(q, 3.0).isCorrect).toBe(false);
  });

  it('grades short_answer by keyword', () => {
    const q = { kind: 'short_answer', answerKey: JSON.stringify({ keywords: ['mitochondria'] }) };
    expect(gradeQuestion(q, 'The mitochondria is the powerhouse').isCorrect).toBe(true);
    expect(gradeQuestion(q, 'ribosomes').isCorrect).toBe(false);
  });

  it('grades matching with partial credit', () => {
    const q = {
      kind: 'matching',
      answerKey: JSON.stringify({ pairs: [['a', '1'], ['b', '2']] }),
    };
    const full = gradeQuestion(q, [['a', '1'], ['b', '2']]);
    expect(full.isCorrect).toBe(true);
    expect(full.score).toBe(1);

    const partial = gradeQuestion(q, [['a', '1'], ['b', '9']]);
    expect(partial.isCorrect).toBe(false);
    expect(partial.score).toBe(0.5);
  });

  it('grades ordering exactly', () => {
    const q = { kind: 'ordering', answerKey: JSON.stringify({ sequence: ['one', 'two', 'three'] }) };
    expect(gradeQuestion(q, ['one', 'two', 'three']).isCorrect).toBe(true);
    expect(gradeQuestion(q, ['one', 'three', 'two']).isCorrect).toBe(false);
  });
});

describe('mastery state transitions via recordAttempt', () => {
  beforeAll(() => {
    resetDb();
    getDb();
    seed();
  });

  afterAll(() => {
    resetDb();
  });

  function mcqQuestion(kind = 'mcq', answerKey?: Record<string, unknown>) {
    const id = uid('qst');
    createQuestion({
      id,
      courseId,
      objectiveId,
      kind,
      prompt: 'question',
      choices: answerKey ? undefined : JSON.stringify([
        { id: 'right', text: 'Right', isCorrect: true },
        { id: 'wrong', text: 'Wrong', isCorrect: false },
      ]),
      answerKey: answerKey ? JSON.stringify(answerKey) : undefined,
    });
    return id;
  }

  it('progresses NOT_STARTED -> INTRODUCED -> PRACTICING -> MASTERED with correct answers', () => {
    const qid = mcqQuestion();

    // First correct answer: evidence 1 -> PRACTICING
    const r1 = recordAttempt({ courseId, userId, questionId: qid, objectiveId, response: 'right' });
    expect(r1.mastery.state).toBe('PRACTICING');
    expect(r1.mastery.evidenceCount).toBe(1);

    // Second correct: evidence 2, streak 2 -> PROVISIONAL
    const r2 = recordAttempt({ courseId, userId, questionId: qid, objectiveId, response: 'right' });
    expect(r2.mastery.state).toBe('PROVISIONAL');

    // Third correct: evidence 3, score 1.0 -> MASTERED
    const r3 = recordAttempt({ courseId, userId, questionId: qid, objectiveId, response: 'right' });
    expect(r3.mastery.state).toBe('MASTERED');
    expect(r3.mastery.nextReviewAt).not.toBeNull();
  });

  it('a wrong answer drops mastery to NEEDS_REVIEW', () => {
    const qid = mcqQuestion('numeric', { correct: 2, tolerance: 0.001 });

    // Reach mastery quickly with numeric answers.
    recordAttempt({ courseId, userId, questionId: qid, objectiveId, response: 2 });
    recordAttempt({ courseId, userId, questionId: qid, objectiveId, response: 2 });
    const mastered = recordAttempt({ courseId, userId, questionId: qid, objectiveId, response: 2 });
    expect(mastered.mastery.state).toBe('MASTERED');

    const wrong = recordAttempt({ courseId, userId, questionId: qid, objectiveId, response: 999 });
    expect(wrong.mastery.state).toBe('NEEDS_REVIEW');
  });

  it('recommendForState derives the correct action', () => {
    const base = {
      id: 'mas_x',
      courseId,
      userId,
      objectiveId,
      objectiveStatement: null,
      objectiveCode: null,
      score: 0,
      attemptCount: 0,
      correctCount: 0,
      evidenceCount: 0,
      streak: 0,
      lastAttemptAt: null,
      nextReviewAt: null,
      reviewIntervalDays: 0,
      updatedAt: 0,
    } as const;

    expect(recommendForState({ ...base, state: 'NEEDS_REVIEW' })).toBe('remediate');
    expect(recommendForState({ ...base, state: 'PRACTICING' })).toBe('more_practice');
    expect(recommendForState({ ...base, state: 'INTRODUCED' })).toBe('more_practice');
    expect(recommendForState({ ...base, state: 'PROVISIONAL' })).toBe('advance');
    expect(recommendForState({ ...base, state: 'MASTERED', nextReviewAt: Date.now() + 1000 })).toBe('cumulative_review');
    expect(recommendForState({ ...base, state: 'MASTERED', nextReviewAt: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toBe('challenge');
    expect(recommendForState({ ...base, state: 'NOT_STARTED' })).toBe('introduce');
  });
});