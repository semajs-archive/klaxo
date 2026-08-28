/**
 * RevisionService — targeted repair of QA failures.
 *
 * The orchestration loop calls `repairQaFailures` with the list of auto-fixable
 * failures from a QA run. Each failure is mapped to a *specific* entity and a
 * *specific* repair action, and only that entity is regenerated — never the
 * whole course. Repairs are bounded and idempotent.
 */
import { getObjective, listObjectives, listLessons, listUnits } from '../db/repo';
import {
  generateLesson,
  generateAssessment,
  persistLesson,
  persistAssessment,
} from './course-generation';
import { logger } from '../lib/logger';

export interface QaFailure {
  checkKey: string;
  entityType?: string;
  entityId?: string;
  message: string;
}

export interface RepairResult {
  checkKey: string;
  entityType?: string;
  entityId?: string;
  repaired: boolean;
  note: string;
}

/**
 * Repair a single QA failure by regenerating the minimal affected artifact.
 */
async function repairOne(courseId: string, failure: QaFailure): Promise<RepairResult> {
  const { checkKey, entityType, entityId } = failure;

  switch (checkKey) {
    case 'objective_assessment_alignment': {
      // Objective missing an aligned assessment question → generate a targeted
      // assessment covering that objective.
      const objectiveId = entityId;
      if (!objectiveId || entityType !== 'objective') {
        return { checkKey, entityType, entityId, repaired: false, note: 'Missing objective id.' };
      }
      const obj = getObjective(objectiveId);
      if (!obj) return { checkKey, entityType, entityId, repaired: false, note: 'Objective not found.' };
      const assessment = await generateAssessment(courseId, [objectiveId], 'formative');
      persistAssessment(courseId, obj.unitId ?? undefined, assessment);
      return { checkKey, entityType, entityId, repaired: true, note: `Generated targeted assessment for objective "${obj.code ?? objectiveId}".` };
    }

    case 'objective_lesson_coverage': {
      // Objective not covered by any lesson → generate a lesson for it.
      const objectiveId = entityId;
      if (!objectiveId || entityType !== 'objective') {
        return { checkKey, entityType, entityId, repaired: false, note: 'Missing objective id.' };
      }
      const obj = getObjective(objectiveId);
      if (!obj || !obj.unitId) return { checkKey, entityType, entityId, repaired: false, note: 'Objective/unit not found.' };
      const lesson = await generateLesson(courseId, obj.unitId, [objectiveId], obj.topicId ?? undefined, 0);
      persistLesson(courseId, obj.unitId, obj.topicId ?? undefined, 0, [objectiveId], lesson);
      return { checkKey, entityType, entityId, repaired: true, note: `Generated missing lesson for objective "${obj.code ?? objectiveId}".` };
    }

    default:
      // Unknown/not-auto-repairable key — skip rather than fabricate a fix.
      return { checkKey, entityType, entityId, repaired: false, note: 'No targeted repair strategy; skipped.' };
  }
}

/**
 * Repair a batch of QA failures. Bounded: only auto-fixable checks are acted
 * on, and only the affected entities are regenerated.
 */
export async function repairQaFailures(
  courseId: string,
  failures: QaFailure[],
): Promise<{ repaired: number; skipped: number; results: RepairResult[] }> {
  const results: RepairResult[] = [];
  let repaired = 0;
  let skipped = 0;

  for (const failure of failures) {
    try {
      const result = await repairOne(courseId, failure);
      if (result.repaired) repaired++;
      else skipped++;
      results.push(result);
    } catch (err) {
      skipped++;
      results.push({
        checkKey: failure.checkKey,
        entityType: failure.entityType,
        entityId: failure.entityId,
        repaired: false,
        note: `Repair failed: ${(err as Error).message}`,
      });
      logger.warn('Revision repair failed', {
        checkKey: failure.checkKey,
        entityId: failure.entityId,
        error: (err as Error).message,
      });
    }
  }

  return { repaired, skipped, results };
}

/** Convenience: collect objectives that still lack lesson coverage (for verdicts). */
export function objectivesNeedingCoverage(courseId: string): string[] {
  const objectives = listObjectives(courseId);
  const lessons = listLessons(courseId);
  const covered = new Set<string>();
  for (const l of lessons) {
    try {
      const ids = JSON.parse(l.objectiveIds) as string[];
      for (const id of ids) covered.add(id);
    } catch { /* ignore malformed */ }
  }
  return objectives.filter((o) => !covered.has(o.id)).map((o) => o.id);
}

/** Convenience: total units (placeholder-free progress reporting). */
export function unitCount(courseId: string): number {
  return listUnits(courseId).length;
}