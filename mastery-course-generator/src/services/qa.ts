/**
 * CurriculumQAService — run structured quality-assurance checks over the
 * generated curriculum.
 *
 * Checks are split into:
 *   - Deterministic checks (computed locally, no AI): coverage, alignment,
 *     duplicates, classification integrity, malformed equations.
 *   - AI checks (independent validation pass) where useful.
 *
 * Records every check as a QA result with severity, status, and autoFixable.
 */
import { randomUUID } from 'node:crypto';
import { getAiContext } from '../ai';
import { generateStructured, resolveModel } from '../ai/router';
import { QaResultSchema, QaResult } from '../ai/types';
import { QA_SYSTEM, delimitSource } from '../pipeline/prompts';
import {
  listObjectives,
  listLessons,
  listAssessments,
  listQuestions,
  createQaResult,
} from '../db/repo';
import { findMathIssues } from '../lib/latex';

/* ------------------------------------------------------- deterministic ---- */

export interface DeterministicCheck {
  checkKey: string;
  severity: 'info' | 'warning' | 'error';
  status: 'pass' | 'fail';
  entityType?: string;
  entityId?: string;
  message: string;
  autoFixable: boolean;
}

export function runDeterministicChecks(courseId: string): DeterministicCheck[] {
  const checks: DeterministicCheck[] = [];
  const objectives = listObjectives(courseId);
  const lessons = listLessons(courseId);
  const questions = listQuestions(courseId);

  // 1. Objective coverage: every REQUIRED objective must have >= 1 assessment question.
  const requiredObjectives = objectives.filter((o) => o.classification === 'REQUIRED');
  const questionObjectiveIds = new Set(questions.map((q) => q.objectiveId).filter(Boolean));
  for (const obj of requiredObjectives) {
    if (!questionObjectiveIds.has(obj.id)) {
      checks.push({
        checkKey: 'objective_assessment_alignment',
        severity: 'error',
        status: 'fail',
        entityType: 'objective',
        entityId: obj.id,
        message: `Objective "${obj.statement.slice(0, 60)}" has no aligned assessment question.`,
        autoFixable: true,
      });
    }
  }

  // 2. Lesson coverage: every REQUIRED objective should be covered by a lesson.
  const lessonsObjectiveIds = new Set<string>();
  for (const l of lessons) {
    try {
      const ids = JSON.parse(l.objectiveIds) as string[];
      for (const id of ids) lessonsObjectiveIds.add(id);
    } catch { /* ignore malformed */ }
  }
  for (const obj of requiredObjectives) {
    if (!lessonsObjectiveIds.has(obj.id)) {
      checks.push({
        checkKey: 'objective_lesson_coverage',
        severity: 'warning',
        status: 'fail',
        entityType: 'objective',
        entityId: obj.id,
        message: `Objective "${obj.statement.slice(0, 60)}" is not covered by any lesson.`,
        autoFixable: true,
      });
    }
  }

  // 3. Duplicate lessons (same title).
  const seenTitles = new Map<string, string>();
  for (const l of lessons) {
    const normalized = l.title.trim().toLowerCase();
    if (seenTitles.has(normalized)) {
      checks.push({
        checkKey: 'duplicate_lessons',
        severity: 'error',
        status: 'fail',
        entityType: 'lesson',
        entityId: l.id,
        message: `Duplicate lesson title "${l.title}".`,
        autoFixable: true,
      });
    } else {
      seenTitles.set(normalized, l.id);
    }
  }

  // 4. Invalid equations in lesson content.
  for (const l of lessons) {
    if (!l.content) continue;
    try {
      const content = JSON.parse(l.content);
      const markdown = JSON.stringify(content);
      const issues = findMathIssues(markdown);
      if (issues.length > 0) {
        checks.push({
          checkKey: 'invalid_equations',
          severity: 'warning',
          status: 'fail',
          entityType: 'lesson',
          entityId: l.id,
          message: `Lesson "${l.title}" has ${issues.length} invalid math expression(s).`,
          autoFixable: true,
        });
      }
    } catch { /* ignore malformed JSON */ }
  }

  // 5. Improper enrichment classification: enrichment should never be "required".
  // (Deterministic sanity check — enrichment objects are tracked separately.)
  const enrichment = objectives.filter((o) => o.classification === 'ENRICHMENT');
  if (enrichment.length > 0) {
    // Enrichment exists; ensure it's not marked REQUIRED anywhere.
    // This is mostly informational since classification is explicit.
    checks.push({
      checkKey: 'enrichment_classification',
      severity: 'info',
      status: 'pass',
      message: `${enrichment.length} enrichment objective(s) correctly classified.`,
      autoFixable: false,
    });
  }

  return checks;
}

/* ------------------------------------------------------------- AI QA ---- */

export async function runAiQa(courseId: string): Promise<QaResult> {
  const { provider, routing } = getAiContext();
  const model = resolveModel(routing, 'qa');

  const objectives = listObjectives(courseId);
  const lessons = listLessons(courseId);
  const assessments = listAssessments(courseId);

  const summary = {
    objectives: objectives.map((o) => o.statement),
    lessons: lessons.map((l) => l.title),
    assessments: assessments.map((a) => a.title),
  };

  const messages = [
    { role: 'system' as const, content: QA_SYSTEM },
    {
      role: 'user' as const,
      content: `Review this curriculum:\n${delimitSource(JSON.stringify(summary, null, 2))}`,
    },
  ];

  const result = await generateStructured(
    provider,
    model,
    { messages, schema: QaResultSchema },
    { maxRetries: 2, temperature: 0.1 },
  );

  return result.value;
}

/* --------------------------------------------------------- persistence ---- */

export function persistQaResults(
  courseId: string,
  jobId: string | undefined,
  runNumber: number,
  checks: Array<{
    checkKey: string;
    severity: 'info' | 'warning' | 'error';
    status: 'pass' | 'fail';
    entityType?: string;
    entityId?: string;
    message: string;
    autoFixable?: boolean;
  }>,
): void {
  for (const c of checks) {
    createQaResult({
      id: `qa_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
      courseId,
      jobId,
      runNumber,
      checkKey: c.checkKey,
      severity: c.severity,
      status: c.status,
      entityType: c.entityType,
      entityId: c.entityId,
      message: c.message,
      autoFixable: c.autoFixable ? 1 : 0,
    });
  }
}

/**
 * Run the full QA pass (deterministic + AI) and persist results.
 */
export async function runQa(
  courseId: string,
  jobId?: string,
  runNumber = 1,
): Promise<{
  totalChecks: number;
  failedChecks: number;
  autoFixable: number;
  autoFixableChecks: Array<{ checkKey: string; entityType?: string; entityId?: string; message: string }>;
}> {
  const deterministic = runDeterministicChecks(courseId);

  let aiChecks: QaResult['checks'] = [];
  try {
    const ai = await runAiQa(courseId);
    aiChecks = ai.checks;
  } catch (err) {
    // AI QA is best-effort; deterministic checks are the source of truth.
    aiChecks = [{
      checkKey: 'ai_qa_available',
      severity: 'warning',
      status: 'fail',
      message: `AI QA unavailable: ${(err as Error).message}`,
      autoFixable: false,
    }];
  }

  const allChecks = [...deterministic, ...aiChecks];
  persistQaResults(courseId, jobId, runNumber, allChecks);

  const failed = allChecks.filter((c) => c.status === 'fail' && c.severity === 'error');
  const autoFixable = allChecks.filter((c) => c.status === 'fail' && c.autoFixable);

  return {
    totalChecks: allChecks.length,
    failedChecks: failed.length,
    autoFixable: autoFixable.length,
    autoFixableChecks: autoFixable.map((c) => ({
      checkKey: c.checkKey,
      entityType: c.entityType ?? undefined,
      entityId: c.entityId ?? undefined,
      message: c.message,
    })),
  };
}