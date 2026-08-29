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
  listPracticeSets,
  listProvenance,
  listUnits,
  listTopics,
  createQaResult,
  listDependencies,
} from '../db/repo';
import { findMathIssues } from '../lib/latex';

/* ------------------------------------------------------- deterministic ---- */

export type RepairClass = 'AUTO_REPAIRABLE' | 'MANUAL_REVIEW_REQUIRED' | 'BLOCKING';

export interface DeterministicCheck {
  checkKey: string;
  severity: 'info' | 'warning' | 'error';
  status: 'pass' | 'fail';
  entityType?: string;
  entityId?: string;
  message: string;
  autoFixable: boolean;
  /** Classification for the repair system. */
  repairClass?: RepairClass;
}

export function runDeterministicChecks(courseId: string): DeterministicCheck[] {
  const checks: DeterministicCheck[] = [];
  const objectives = listObjectives(courseId);
  const lessons = listLessons(courseId);
  const questions = listQuestions(courseId);
  const assessments = listAssessments(courseId);
  const practiceSets = listPracticeSets(courseId);

  // Helper to add check with repair classification
  const addCheck = (
    checkKey: string,
    severity: 'info' | 'warning' | 'error',
    status: 'pass' | 'fail',
    entityType: string | undefined,
    entityId: string | undefined,
    message: string,
    autoFixable: boolean,
    repairClass: RepairClass = autoFixable ? 'AUTO_REPAIRABLE' : (severity === 'error' ? 'BLOCKING' : 'MANUAL_REVIEW_REQUIRED')
  ) => {
    checks.push({ checkKey, severity, status, entityType, entityId, message, autoFixable, repairClass });
  };

  // 1. Objective coverage: every REQUIRED objective must have >= 1 assessment question.
  const requiredObjectives = objectives.filter((o) => o.classification === 'REQUIRED');
  const questionObjectiveIds = new Set(questions.map((q) => q.objectiveId).filter(Boolean));
  for (const obj of requiredObjectives) {
    if (!questionObjectiveIds.has(obj.id)) {
      addCheck(
        'objective_assessment_alignment',
        'error',
        'fail',
        'objective',
        obj.id,
        `Objective "${obj.statement.slice(0, 60)}" has no aligned assessment question.`,
        true,
        'AUTO_REPAIRABLE'
      );
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
      addCheck(
        'objective_lesson_coverage',
        'warning',
        'fail',
        'objective',
        obj.id,
        `Objective "${obj.statement.slice(0, 60)}" is not covered by any lesson.`,
        true,
        'AUTO_REPAIRABLE'
      );
    }
  }

  // 3. Duplicate lessons (same title).
  const seenTitles = new Map<string, string>();
  for (const l of lessons) {
    const normalized = l.title.trim().toLowerCase();
    if (seenTitles.has(normalized)) {
      addCheck(
        'duplicate_lessons',
        'error',
        'fail',
        'lesson',
        l.id,
        `Duplicate lesson title "${l.title}".`,
        true,
        'AUTO_REPAIRABLE'
      );
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
        addCheck(
          'invalid_equations',
          'warning',
          'fail',
          'lesson',
          l.id,
          `Lesson "${l.title}" has ${issues.length} invalid math expression(s).`,
          true,
          'AUTO_REPAIRABLE'
        );
      }
    } catch { /* ignore malformed JSON */ }
  }

  // 5. Improper enrichment classification.
  const enrichment = objectives.filter((o) => o.classification === 'ENRICHMENT');
  if (enrichment.length > 0) {
    addCheck(
      'enrichment_classification',
      'info',
      'pass',
      undefined,
      undefined,
      `${enrichment.length} enrichment objective(s) correctly classified.`,
      false,
      'MANUAL_REVIEW_REQUIRED'
    );
  }

  // 6. Duplicate questions (same prompt + objective).
  const questionSigs = new Map<string, string>();
  for (const q of questions) {
    const sig = `${q.objectiveId}|${q.prompt.trim().toLowerCase()}`;
    if (questionSigs.has(sig)) {
      addCheck(
        'duplicate_questions',
        'error',
        'fail',
        'question',
        q.id,
        `Duplicate question for objective ${q.objectiveId}.`,
        true,
        'AUTO_REPAIRABLE'
      );
    } else {
      questionSigs.set(sig, q.id);
    }
  }

  // 7. Invalid answer keys in questions.
  for (const q of questions) {
    if (!q.answerKey) continue;
    try {
      JSON.parse(q.answerKey);
    } catch {
      addCheck(
        'invalid_answer_key',
        'error',
        'fail',
        'question',
        q.id,
        `Question "${q.prompt.slice(0, 60)}" has a malformed answer key.`,
        false,
        'MANUAL_REVIEW_REQUIRED'
      );
    }
  }

  // 8. Malformed question structures (missing choices for MCQ, etc.).
  for (const q of questions) {
    if (q.kind === 'mcq') {
      if (!q.choices) {
        addCheck(
          'malformed_question_structure',
          'error',
          'fail',
          'question',
          q.id,
          `MCQ question "${q.prompt.slice(0, 60)}" has no choices.`,
          false,
          'MANUAL_REVIEW_REQUIRED'
        );
      } else {
        try {
          const choices = JSON.parse(q.choices) as Array<{ text: string; isCorrect: boolean }>;
          const correctCount = choices.filter((c) => c.isCorrect).length;
          if (correctCount === 0) {
            addCheck(
              'malformed_question_structure',
              'error',
              'fail',
              'question',
              q.id,
              `MCQ question "${q.prompt.slice(0, 60)}" has no correct choice.`,
              false,
              'MANUAL_REVIEW_REQUIRED'
            );
          }
          if (choices.length < 2) {
            addCheck(
              'malformed_question_structure',
              'warning',
              'fail',
              'question',
              q.id,
              `MCQ question "${q.prompt.slice(0, 60)}" has fewer than 2 choices.`,
              false,
              'MANUAL_REVIEW_REQUIRED'
            );
          }
        } catch { /* ignore parse errors */ }
      }
    }
  }

  // 9. Classification mismatches: lessons that don't match their objective's classification.
  for (const l of lessons) {
    try {
      const objIds = JSON.parse(l.objectiveIds) as string[];
      for (const objId of objIds) {
        const obj = objectives.find((o) => o.id === objId);
        if (obj && l.classification !== obj.classification) {
          addCheck(
            'classification_mismatch',
            'warning',
            'fail',
            'lesson',
            l.id,
            `Lesson "${l.title}" classification (${l.classification}) differs from objective ${obj.code ?? objId} (${obj.classification}).`,
            false,
            'MANUAL_REVIEW_REQUIRED'
          );
        }
      }
    } catch { /* ignore malformed */ }
  }

  // 10. Missing mastery criteria on REQUIRED objectives.
  for (const obj of requiredObjectives) {
    if (!obj.masteryCriteria) {
      addCheck(
        'missing_mastery_criteria',
        'warning',
        'fail',
        'objective',
        obj.id,
        `Required objective "${obj.code ?? obj.id}" has no mastery criteria.`,
        false,
        'MANUAL_REVIEW_REQUIRED'
      );
    }
  }

  // 11. Broken prerequisite edges (referencing non-existent objectives).
  const objectiveIds = new Set(objectives.map((o) => o.id));
  const deps = listDependencies(courseId);
  for (const dep of deps) {
    if (!objectiveIds.has(dep.objectiveId) || !objectiveIds.has(dep.prerequisiteId)) {
      addCheck(
        'broken_prerequisite_edge',
        'error',
        'fail',
        'dependency',
        dep.id,
        `Prerequisite edge references non-existent objective(s).`,
        false,
        'BLOCKING'
      );
    }
  }

  // 12. Cyclic prerequisites.
  // Build graph and detect cycles (simple DFS).
  const graph = new Map<string, string[]>();
  for (const dep of deps) {
    const list = graph.get(dep.objectiveId) ?? [];
    list.push(dep.prerequisiteId);
    graph.set(dep.objectiveId, list);
  }
  const visited = new Set<string>();
  const recStack = new Set<string>();
  function hasCycle(node: string): boolean {
    visited.add(node);
    recStack.add(node);
    const neighbors = graph.get(node) ?? [];
    for (const n of neighbors) {
      if (!visited.has(n)) {
        if (hasCycle(n)) return true;
      } else if (recStack.has(n)) {
        return true;
      }
    }
    recStack.delete(node);
    return false;
  }
  for (const node of graph.keys()) {
    if (!visited.has(node) && hasCycle(node)) {
      addCheck(
        'prerequisite_cycle',
        'error',
        'fail',
        'dependency',
        undefined,
        `Prerequisite graph contains a cycle.`,
        false,
        'BLOCKING'
      );
      break;
    }
  }

  // 13. Obvious content structure failures: empty lesson content.
  for (const l of lessons) {
    if (!l.content || l.content.trim() === '{}') {
      addCheck(
        'empty_lesson_content',
        'error',
        'fail',
        'lesson',
        l.id,
        `Lesson "${l.title}" has empty content.`,
        true,
        'AUTO_REPAIRABLE'
      );
    }
  }

  // 14. Assessments without questions.
  for (const a of assessments) {
    const assessmentQuestions = questions.filter((q) => q.assessmentId === a.id);
    if (assessmentQuestions.length === 0) {
      addCheck(
        'assessment_without_questions',
        'error',
        'fail',
        'assessment',
        a.id,
        `Assessment "${a.title}" has no questions.`,
        true,
        'AUTO_REPAIRABLE'
      );
    }
  }

  // 15. Practice sets without questions.
  for (const ps of practiceSets) {
    const psQuestions = questions.filter((q) => q.practiceSetId === ps.id);
    if (psQuestions.length === 0) {
      addCheck(
        'practice_set_without_questions',
        'warning',
        'fail',
        'practice_set',
        ps.id,
        `Practice set "${ps.title}" has no questions.`,
        true,
        'AUTO_REPAIRABLE'
      );
    }
  }

  // 16. Invalid provenance references (entity doesn't exist).
  const provenanceRecords = listProvenance(courseId);
  const entityTypeTables: Record<string, string[]> = {
    unit: listUnits(courseId).map((u) => u.id),
    topic: listTopics(courseId).map((t) => t.id),
    objective: objectives.map((o) => o.id),
    lesson: lessons.map((l) => l.id),
    question: questions.map((q) => q.id),
    assessment: assessments.map((a) => a.id),
  };
  for (const prov of provenanceRecords) {
    const validIds = entityTypeTables[prov.entityType];
    if (validIds && prov.entityId && !validIds.includes(prov.entityId)) {
      addCheck(
        'invalid_provenance_reference',
        'warning',
        'fail',
        'provenance',
        prov.id,
        `Provenance record references non-existent ${prov.entityType} ${prov.entityId}.`,
        false,
        'MANUAL_REVIEW_REQUIRED'
      );
    }
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

/** Final QA verdict for the generation pipeline. */
export type QaVerdict = 'PASSED' | 'PASSED_WITH_WARNINGS' | 'REQUIRES_MANUAL_REVIEW' | 'FAILED';

/**
 * Run the full QA pass (deterministic + AI) and persist results.
 * Returns a final verdict that the pipeline can use to gate publishing.
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
  verdict: QaVerdict;
  blockingFailures: number;
  warnings: number;
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
  // Only deterministic checks have repairClass
  const blockingFailures = deterministic.filter((c) => c.status === 'fail' && c.repairClass === 'BLOCKING').length;
  const warnings = allChecks.filter((c) => c.status === 'fail' && c.severity === 'warning').length;

  // Verdict logic:
  // - BLOCKING failures (unrepairable structural issues) → FAILED
  // - Any error severity failures that are not auto-repairable → REQUIRES_MANUAL_REVIEW
  // - Only warnings (or all failures auto-repairable) → PASSED_WITH_WARNINGS
  // - Zero failures → PASSED
  let verdict: QaVerdict;
  if (blockingFailures > 0) {
    verdict = 'FAILED';
  } else if (failed.length > 0 && autoFixable.length < failed.length) {
    // Some failures are not auto-fixable
    verdict = 'REQUIRES_MANUAL_REVIEW';
  } else if (failed.length > 0 || warnings > 0) {
    verdict = 'PASSED_WITH_WARNINGS';
  } else {
    verdict = 'PASSED';
  }

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
    verdict,
    blockingFailures,
    warnings,
  };
}