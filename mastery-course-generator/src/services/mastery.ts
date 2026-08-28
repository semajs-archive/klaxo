/**
 * Mastery engine & interactive practice/assessment backend.
 *
 * This service implements a real, evidence-based mastery model driven purely by
 * `recordAttempt`. Mastery is NEVER derived from lesson opens or content views —
 * only from graded question attempts. The engine:
 *
 *   - grades responses against a question's structured answer key/choices;
 *   - records every attempt for auditability;
 *   - updates a per-objective mastery record (score, counts, streak, state);
 *   - recomputes a spaced-review schedule on the way to mastery;
 *   - returns a concrete next action (remediate / practice / advance / review).
 */
import {
  getQuestion,
  getObjective,
  listObjectives,
  getMasteryRecord,
  listMasteryRecords,
  updateMasteryRecord,
  createMasteryRecord,
  createQuestionAttempt,
} from '../db/repo';
import { newId } from '../lib/ids';
import { notFound, badRequest } from '../lib/errors';
import type { MasteryState } from '../ai/types';

/* ------------------------------------------------------------------ types ---- */

export type RecommendationAction =
  | 'remediate'
  | 'more_practice'
  | 'advance'
  | 'challenge'
  | 'cumulative_review'
  | 'introduce';

export interface GradeResult {
  isCorrect: boolean;
  score: number;
  explanation: string;
  misconceptionTag: string | null;
}

export interface MasteryRecordView {
  id: string;
  courseId: string;
  userId: string;
  objectiveId: string;
  objectiveStatement: string | null;
  objectiveCode: string | null;
  state: MasteryState;
  score: number;
  attemptCount: number;
  correctCount: number;
  evidenceCount: number;
  streak: number;
  lastAttemptAt: number | null;
  nextReviewAt: number | null;
  reviewIntervalDays: number;
  updatedAt: number;
}

export interface AttemptResult {
  attempt: Record<string, unknown>;
  mastery: MasteryRecordView;
  recommendation: RecommendationAction;
}

type QuestionRow = Record<string, unknown>;

/* ------------------------------------------------------------ grading ---- */

/** Spaced-review intervals, indexed by evidenceCount (0-based → increasing). */
const REVIEW_INTERVAL_DAYS: number[] = [1, 2, 4, 7, 14, 30];

/**
 * Pick the next review interval for an objective given how many pieces of
 * qualifying evidence have been accumulated. Past the table we keep the ceiling
 * interval (30 days).
 */
export function computeNextReview(evidenceCount: number): number {
  const idx = Math.max(0, Math.min(evidenceCount, REVIEW_INTERVAL_DAYS.length - 1));
  return REVIEW_INTERVAL_DAYS[idx] ?? 30;
}

/** Normalize a string for short-answer/keyword comparisons. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Coerce an unknown answer value into a comparable number, or NaN. */
function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v.trim());
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}

/** Extract a list of acceptable strings from a scalar, array, or object value. */
function stringVariants(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.flatMap(stringVariants);
  if (typeof v === 'object') return Object.values(v as Record<string, unknown>).flatMap(stringVariants);
  return [String(v)];
}

function normalizeValues(v: unknown): string[] {
  return stringVariants(v).map(normalize).filter(Boolean);
}

function numericValues(v: unknown): number[] {
  return stringVariants(v).map(toNumber).filter((n) => Number.isFinite(n));
}

/** Parse a JSON column that may already be an object/array. */
function parseJson(raw: unknown): unknown {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}

interface AnswerKey {
  correct?: unknown;
  answer?: unknown;
  value?: unknown;
  acceptable?: unknown;
  answers?: unknown;
  tolerance?: number;
  pairs?: unknown;
  sequence?: unknown;
  keywords?: unknown;
}

interface Choice {
  id?: string;
  text?: string;
  index?: number;
  isCorrect?: boolean;
}

/**
 * Grade a learner response against a question's structured content.
 *
 * Supported kinds:
 *   - mcq:         match by choice id, index, or text;
 *   - numeric:     numeric equality within `tolerance` (default 0.001);
 *   - short_answer: normalized substring/keyword match against accepted answers;
 *   - matching:    ordered pair list match;
 *   - ordering:    exact sequence match;
 *   - proof/code/essay: ungraded/manual — score 0 with a note unless
 *                  `answerKey.keywords` is present (then a keyword heuristic).
 */
export function gradeQuestion(question: QuestionRow, response: unknown): GradeResult {
  const kind = String(question.kind ?? 'short_answer');
  const answerKey = (parseJson(question.answerKey) ?? {}) as AnswerKey;
  const choices = (parseJson(question.choices) ?? []) as Choice[];
  const explanation = String(question.explanation ?? '');
  const misconceptionTag: string | null = question.misconceptions
    ? (() => {
        const m = parseJson(question.misconceptions);
        if (Array.isArray(m) && typeof m[0] === 'string') return String(m[0]);
        return null;
      })()
    : null;

  switch (kind) {
    case 'mcq': {
      const respStr = response == null ? '' : String(response).trim();
      // Find the correct choice(s).
      const correctChoices = choices.filter((c) => c.isCorrect === true);
      if (correctChoices.length === 0) {
        // Fall back to answerKey.
        const expected = normalizeValues(answerKey.correct ?? answerKey.answer ?? answerKey.value);
        const match = expected.length > 0 && expected.includes(normalize(respStr));
        return {
          isCorrect: match,
          score: match ? 1 : 0,
          explanation,
          misconceptionTag: match ? null : misconceptionTag,
        };
      }
      const isCorrect = correctChoices.some((c) => {
        const resp = respStr.toLowerCase();
        const byText = c.text != null && c.text.trim().toLowerCase() === resp;
        const byId = c.id != null && c.id === resp;
        const byIndex = c.index != null && String(c.index) === resp;
        return byText || byId || byIndex;
      });
      return { isCorrect, score: isCorrect ? 1 : 0, explanation, misconceptionTag: isCorrect ? null : misconceptionTag };
    }

    case 'numeric': {
      const expected = numericValues(answerKey.correct ?? answerKey.answer ?? answerKey.value);
      const tolerance = toNumber(answerKey.tolerance);
      const tol = Number.isFinite(tolerance) ? Math.abs(tolerance) : 1e-3;
      const respNum = toNumber(response);
      if (!Number.isFinite(respNum) || expected.length === 0) {
        return { isCorrect: false, score: 0, explanation, misconceptionTag };
      }
      const isCorrect = expected.some((e) => Math.abs(e - respNum) <= tol);
      // Partial credit: closer → higher, floor at 0.
      const best = Math.min(...expected.map((e) => Math.abs(e - respNum)));
      const score = isCorrect ? 1 : Math.max(0, 1 - best / Math.max(tol * 4, 1e-6));
      return { isCorrect, score: isCorrect ? 1 : Math.round(score * 100) / 100, explanation, misconceptionTag: isCorrect ? null : misconceptionTag };
    }

    case 'short_answer': {
      const accepted = normalizeValues(
        answerKey.acceptable ?? answerKey.answers ?? answerKey.answer ?? answerKey.correct ?? answerKey.value,
      );
      const keywords = normalizeValues(answerKey.keywords);
      if (accepted.length === 0 && keywords.length === 0) {
        // No machine-gradable key → manual, score 0 with a note.
        return { isCorrect: false, score: 0, explanation, misconceptionTag };
      }
      const resp = normalize(String(response ?? ''));
      const acceptedMatch = accepted.length > 0 && accepted.some((a) => resp === a || resp.includes(a) || a.includes(resp));
      if (acceptedMatch) {
        return { isCorrect: true, score: 1, explanation, misconceptionTag: null };
      }
      if (keywords.length > 0) {
        const hits = keywords.filter((k) => resp.includes(k)).length;
        const ratio = hits / keywords.length;
        const isCorrect = ratio >= 0.5;
        return { isCorrect, score: Math.round(ratio * 100) / 100, explanation, misconceptionTag: isCorrect ? null : misconceptionTag };
      }
      return { isCorrect: false, score: 0, explanation, misconceptionTag };
    }

    case 'matching': {
      const pairs = (parseJson(answerKey.pairs ?? answerKey.answers ?? answerKey.answer) ?? []) as unknown[];
      if (!Array.isArray(pairs) || pairs.length === 0) {
        return { isCorrect: false, score: 0, explanation, misconceptionTag };
      }
      const expected = pairs.map((p) => normalizeValues(p));
      const given = Array.isArray(response) ? response.map((r) => normalizeValues(r)) : normalizeValues(response);
      const total = expected.length;
      let correct = 0;
      for (let i = 0; i < total; i++) {
        const exp = expected[i] ?? [];
        const got = given[i] ?? [];
        if (exp.length === got.length && exp.every((e, j) => e === got[j])) correct++;
      }
      const score = total === 0 ? 0 : correct / total;
      return { isCorrect: correct === total, score, explanation, misconceptionTag: correct === total ? null : misconceptionTag };
    }

    case 'ordering': {
      const sequence = normalizeValues(answerKey.sequence ?? answerKey.answers ?? answerKey.answer);
      if (sequence.length === 0) {
        return { isCorrect: false, score: 0, explanation, misconceptionTag };
      }
      const given = Array.isArray(response) ? response.map((r) => normalize(String(r))) : normalizeValues(response);
      const isCorrect = sequence.length === given.length && sequence.every((s, i) => s === given[i]);
      return { isCorrect, score: isCorrect ? 1 : 0, explanation, misconceptionTag: isCorrect ? null : misconceptionTag };
    }

    case 'proof':
    case 'code':
    case 'essay':
    default: {
      // Ungraded/manual by default; optional keyword heuristic.
      const keywords = normalizeValues(answerKey.keywords);
      if (keywords.length > 0) {
        const resp = normalize(String(response ?? ''));
        const hits = keywords.filter((k) => resp.includes(k)).length;
        const ratio = hits / keywords.length;
        const isCorrect = ratio >= 0.6;
        return { isCorrect, score: Math.round(ratio * 100) / 100, explanation, misconceptionTag: isCorrect ? null : misconceptionTag };
      }
      return { isCorrect: false, score: 0, explanation: explanation || 'Manual review required.', misconceptionTag };
    }
  }
}

/* ------------------------------------------------------ state machine ---- */

const MASTERY_THRESHOLD_EVIDENCE = 3;
const PROVISIONAL_THRESHOLD_EVIDENCE = 2;
const MASTERY_SCORE = 0.8;

/**
 * Advance the mastery state machine given the updated record's metrics. Returns
 * the new state.
 */
function nextState(prev: MasteryState, opts: {
  isCorrect: boolean;
  evidenceCount: number;
  score: number;
  streak: number;
}): MasteryState {
  const { isCorrect, evidenceCount, score, streak } = opts;

  // A wrong answer after having reached mastery/ provisional drops to review.
  if (!isCorrect && (prev === 'MASTERED' || prev === 'PROVISIONAL')) {
    return 'NEEDS_REVIEW';
  }
  if (prev === 'NEEDS_REVIEW') {
    // Recovering from review: a correct answer moves back into practicing.
    return isCorrect ? 'PRACTICING' : 'NEEDS_REVIEW';
  }

  // Forward progression, driven only by qualifying correct evidence.
  if (!isCorrect) {
    return prev === 'NOT_STARTED' ? 'INTRODUCED' : 'PRACTICING';
  }

  if (evidenceCount >= MASTERY_THRESHOLD_EVIDENCE && score >= MASTERY_SCORE) {
    return 'MASTERED';
  }
  if (evidenceCount >= PROVISIONAL_THRESHOLD_EVIDENCE && streak >= 2) {
    return 'PROVISIONAL';
  }
  if (evidenceCount >= 1) {
    return 'PRACTICING';
  }
  return 'INTRODUCED';
}

/* -------------------------------------------------------------- views ---- */

function toMasteryView(record: Record<string, unknown>, objectiveStatement: string | null, objectiveCode: string | null): MasteryRecordView {
  return {
    id: String(record.id),
    courseId: String(record.courseId),
    userId: String(record.userId),
    objectiveId: String(record.objectiveId),
    objectiveStatement,
    objectiveCode,
    state: String(record.state) as MasteryState,
    score: Number(record.score ?? 0),
    attemptCount: Number(record.attemptCount ?? 0),
    correctCount: Number(record.correctCount ?? 0),
    evidenceCount: Number(record.evidenceCount ?? 0),
    streak: Number(record.streak ?? 0),
    lastAttemptAt: record.lastAttemptAt != null ? Number(record.lastAttemptAt) : null,
    nextReviewAt: record.nextReviewAt != null ? Number(record.nextReviewAt) : null,
    reviewIntervalDays: Number(record.reviewIntervalDays ?? 0),
    updatedAt: Number(record.updatedAt ?? 0),
  };
}

/* -------------------------------------------------------- recordAttempt ---- */

export function recordAttempt(input: {
  courseId: string;
  userId: string;
  questionId: string;
  objectiveId: string;
  response: unknown;
  durationMs?: number;
}): AttemptResult {
  const { courseId, userId, questionId, objectiveId, response, durationMs } = input;

  const question = getQuestion(questionId);
  if (!question) throw notFound('Question not found');
  // Ownership: the question must belong to the course.
  if (String(question.courseId) !== courseId) throw notFound('Question not found');

  const grade = gradeQuestion(question, response);
  const now = Date.now();

  // Persist the attempt.
  const attempt = createQuestionAttempt({
    id: newId('att'),
    courseId,
    userId,
    questionId,
    objectiveId,
    response: response == null ? undefined : JSON.stringify(response),
    isCorrect: grade.isCorrect ? 1 : 0,
    score: grade.score,
    misconceptionTag: grade.misconceptionTag ?? undefined,
    durationMs: durationMs ?? undefined,
  });

  // Load / create the mastery record for this objective.
  let record = getMasteryRecord(courseId, userId, objectiveId);
  if (!record) {
    record = createMasteryRecord({
      id: newId('mas'),
      courseId,
      userId,
      objectiveId,
      state: 'NOT_STARTED',
      score: 0,
    });
  }

  const attemptCount = Number(record.attemptCount ?? 0) + 1;
  const correctCount = Number(record.correctCount ?? 0) + (grade.isCorrect ? 1 : 0);
  const prevState = String(record.state) as MasteryState;
  const correctStreak = grade.isCorrect ? Number(record.streak ?? 0) + 1 : 0;

  // Evidence: only graded correct attempts qualify.
  const evidenceCount = Number(record.evidenceCount ?? 0) + (grade.isCorrect ? 1 : 0);
  const score = attemptCount === 0 ? 0 : correctCount / attemptCount;

  const state = nextState(prevState, { isCorrect: grade.isCorrect, evidenceCount, score, streak: correctStreak });

  // Spaced review: only schedule forward review when mastered.
  let nextReviewAt: number | null = record.nextReviewAt != null ? Number(record.nextReviewAt) : null;
  let reviewIntervalDays = Number(record.reviewIntervalDays ?? 0);

  if (state === 'MASTERED' && grade.isCorrect) {
    reviewIntervalDays = computeNextReview(evidenceCount);
    nextReviewAt = now + reviewIntervalDays * 24 * 60 * 60 * 1000;
  }

  const updated = updateMasteryRecord(String(record.id), {
    state,
    score,
    attemptCount,
    correctCount,
    evidenceCount,
    streak: correctStreak,
    lastAttemptAt: now,
    nextReviewAt: nextReviewAt ?? undefined,
    reviewIntervalDays,
  });

  const objective = getObjective(objectiveId);
  const view = toMasteryView(updated ?? record, objective?.statement ?? null, objective?.code ?? null);

  return {
    attempt,
    mastery: view,
    recommendation: recommendForState(view),
  };
}

/** Derive the single most useful next action from a mastery record. */
export function recommendForState(record: MasteryRecordView): RecommendationAction {
  if (record.state === 'NEEDS_REVIEW') return 'remediate';
  if (record.state === 'MASTERED') {
    // Mastered but a review is due soon → cumulative review.
    if (record.nextReviewAt != null && record.nextReviewAt <= Date.now() + 7 * 24 * 60 * 60 * 1000) {
      return 'cumulative_review';
    }
    return 'challenge';
  }
  if (record.state === 'PROVISIONAL') return 'advance';
  if (record.state === 'PRACTICING') return 'more_practice';
  if (record.state === 'INTRODUCED') return 'more_practice';
  return 'introduce';
}

/* ------------------------------------------------------------ listing ---- */

export interface MasteryListing {
  records: MasteryRecordView[];
  upcomingReview: MasteryRecordView[];
  objectiveCount: number;
  masteredCount: number;
}

export function listMastery(courseId: string, userId: string): MasteryListing {
  const records = listMasteryRecords(courseId, userId);
  const objectives = listObjectives(courseId);
  const objectiveMap = new Map(objectives.map((o) => [String(o.id), o]));

  const views = records.map((r) => {
    const obj = objectiveMap.get(String(r.objectiveId));
    return toMasteryView(r, obj?.statement != null ? String(obj.statement) : null, obj?.code != null ? String(obj.code) : null);
  });

  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const upcomingReview = views.filter(
    (v) => v.nextReviewAt != null && v.nextReviewAt <= now + week,
  );

  const masteredCount = views.filter((v) => v.state === 'MASTERED').length;

  return {
    records: views,
    upcomingReview,
    objectiveCount: objectives.length,
    masteredCount,
  };
}

/* ------------------------------------------------------- recommendations ---- */

export interface LearnerRecommendations {
  prerequisiteReview: MasteryRecordView[];
  remediation: MasteryRecordView[];
  morePractice: MasteryRecordView[];
  advancement: MasteryRecordView[];
  cumulativeReview: MasteryRecordView[];
}

export function recommendActions(courseId: string, userId: string): LearnerRecommendations {
  const { records, upcomingReview } = listMastery(courseId, userId);

  const remediation = records.filter((r) => r.state === 'NEEDS_REVIEW');
  const morePractice = records.filter((r) => r.state === 'PRACTICING' || r.state === 'INTRODUCED');
  const advancement = records.filter((r) => r.state === 'PROVISIONAL');

  // Prerequisite review: objectives mastered that are NOT yet attempted but are
  // prerequisites of in-progress objectives. We approximate by flagging
  // NOT_STARTED objectives that appear before a NEEDS_REVIEW objective in order.
  // For a lightweight heuristic we surface any NOT_STARTED objective whose
  // ordinal precedes a remediation objective.
  const remediatingOrdinals = new Set<number>();
  for (const r of remediation) {
    const obj = getObjective(r.objectiveId);
    if (obj) remediatingOrdinals.add(Number(obj.ordinal ?? 0));
  }
  const prerequisiteReview = records.filter((r) => {
    if (r.state !== 'NOT_STARTED') return false;
    const obj = getObjective(r.objectiveId);
    if (!obj) return false;
    const ord = Number(obj.ordinal ?? 0);
    return [...remediatingOrdinals].some((o) => ord < o);
  });

  return {
    prerequisiteReview,
    remediation,
    morePractice,
    advancement,
    cumulativeReview: upcomingReview,
  };
}

/** Re-exported helper so routes can validate a single objective's mastery. */
export function getSingleMastery(courseId: string, userId: string, objectiveId: string): MasteryRecordView {
  const record = getMasteryRecord(courseId, userId, objectiveId);
  if (!record) throw notFound('Mastery record not found');
  const obj = getObjective(objectiveId);
  return toMasteryView(record, obj?.statement != null ? String(obj.statement) : null, obj?.code != null ? String(obj.code) : null);
}

/** Validate a question belongs to a course before grading (ownership). */
export function assertQuestionInCourse(questionId: string, courseId: string): void {
  const question = getQuestion(questionId);
  if (!question) throw notFound('Question not found');
  if (String(question.courseId) !== courseId) throw badRequest('Question does not belong to this course');
}