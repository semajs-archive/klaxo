/**
 * Generation Pipeline Orchestrator
 *
 * Executes the full pipeline as a persisted job with streaming progress events:
 *
 *   USER INPUT → INGESTION → SOURCE EXTRACTION → ... → PUBLISHED COURSE
 *
 * Each stage updates the job record, emits a generation event (so the UI can
 * stream progress), and persists intermediate results so the UI recovers after
 * browser refresh. Idempotency keys block duplicate jobs.
 */
import { randomUUID } from 'node:crypto';
import {
  getGenerationJob,
  getGenerationJobByRequestKey,
  createGenerationJob,
  updateGenerationJob,
  createGenerationEvent,
  getLesson,
  listObjectives,
  listUnits,
} from '../db/repo';
import { analyzeSources } from '../services/source-analysis';
import {
  generateBlueprint,
  persistBlueprint,
  generateLesson,
  generatePractice,
  generateAssessment,
  persistLesson,
  persistPracticeSet,
  persistAssessment,
} from '../services/course-generation';
import { runQa } from '../services/qa';
import { repairQaFailures } from '../services/revision';
import { JobKind, JobState, CurriculumBlueprint } from '../ai/types';
import { pipelineFailed } from '../lib/errors';

/* --------------------------------------------------------------- types ---- */

export interface StartJobInput {
  courseId: string;
  userId: string;
  kind: JobKind;
  requestKey?: string;
  input?: unknown;
}

export interface JobProgress {
  jobId: string;
  state: JobState;
  stage: string;
  progress: number;
  message: string;
}

/* ------------------------------------------------------- job management ---- */

async function emit(
  jobId: string,
  courseId: string,
  stage: string,
  message: string,
  ordinal: number,
  level: 'info' | 'warn' | 'error' = 'info',
): Promise<void> {
  createGenerationEvent({
    id: `ev_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
    jobId,
    courseId,
    ordinal,
    stage,
    level,
    message,
  });
}

async function setState(
  jobId: string,
  state: JobState,
  stage: string,
  progress: number,
  message: string,
): Promise<void> {
  updateGenerationJob(jobId, { state, stage, progress, message });
}

/**
 * Start a job (idempotent by requestKey).
 */
export function startJob(input: StartJobInput): { jobId: string; created: boolean } {
  const existing = input.requestKey
    ? getGenerationJobByRequestKey(input.requestKey)
    : undefined;

  if (existing) {
    return { jobId: existing.id, created: false };
  }

  const jobId = `job_${randomUUID().replace(/-/g, '').slice(0,24)}`;
  createGenerationJob({
    id: jobId,
    courseId: input.courseId,
    userId: input.userId,
    kind: input.kind,
    requestKey: input.requestKey,
    input: input.input ? JSON.stringify(input.input) : undefined,
  });

  return { jobId, created: true };
}

/* ------------------------------------------------------- job execution ---- */

/**
 * Execute an ANALYZE_SOURCE job.
 */
export async function executeAnalyzeSourceJob(jobId: string, courseId: string, documentIds: string[]): Promise<void> {
  await setState(jobId, 'ANALYZING', 'source_extraction', 0.1, 'Reading sources…');
  await emit(jobId, courseId, 'source_extraction', 'Reading sources…', 0);

  try {
    await setState(jobId, 'ANALYZING', 'source_extraction', 0.3, 'Extracting structure…');
    await emit(jobId, courseId, 'source_extraction', 'Extracting structure…', 1);

    await setState(jobId, 'ANALYZING', 'source_extraction', 0.6, 'Building knowledge package…');
    await emit(jobId, courseId, 'source_extraction', 'Building knowledge package…', 2);

    const result = await analyzeSources({ courseId, documentIds });

    await setState(jobId, 'COMPLETED', 'source_extraction', 1.0, 'Source analyzed.');
    updateGenerationJob(jobId, {
      state: 'COMPLETED',
      stage: 'source_extraction',
      progress: 1,
      finishedAt: Date.now(),
      result: JSON.stringify(result),
    });
    await emit(jobId, courseId, 'source_extraction', 'Source analyzed.', 3);
  } catch (err) {
    await setState(jobId, 'FAILED', 'source_extraction', 0, `Source analysis failed: ${(err as Error).message}`);
    updateGenerationJob(jobId, {
      state: 'FAILED',
      finishedAt: Date.now(),
      error: (err as Error).message,
    });
    throw pipelineFailed(`Source analysis failed: ${(err as Error).message}`);
  }
}

/**
 * Execute a BLUEPRINT job (generate + persist blueprint).
 */
export async function executeBlueprintJob(jobId: string, courseId: string): Promise<void> {
  await setState(jobId, 'PLANNING', 'blueprint', 0.1, 'Designing curriculum…');
  await emit(jobId, courseId, 'blueprint', 'Designing curriculum blueprint…', 0);

  try {
    const blueprint = await generateBlueprint(courseId);

    await setState(jobId, 'PLANNING', 'blueprint', 0.6, 'Persisting blueprint…');
    await persistBlueprint(courseId, blueprint);

    await setState(jobId, 'COMPLETED', 'blueprint', 1.0, 'Blueprint ready.');
    updateGenerationJob(jobId, {
      state: 'COMPLETED',
      stage: 'blueprint',
      progress: 1,
      finishedAt: Date.now(),
      result: JSON.stringify(blueprint),
    });
    await emit(jobId, courseId, 'blueprint', 'Curriculum blueprint ready.', 1);
  } catch (err) {
    await setState(jobId, 'FAILED', 'blueprint', 0, `Blueprint failed: ${(err as Error).message}`);
    updateGenerationJob(jobId, { state: 'FAILED', finishedAt: Date.now(), error: (err as Error).message });
    throw pipelineFailed(`Blueprint failed: ${(err as Error).message}`);
  }
}

/**
 * Execute a GENERATE_COURSE job (blueprint + lessons + practice + assessments
 * + QA + revision loop).
 */
export async function executeGenerateCourseJob(jobId: string, courseId: string): Promise<void> {
  let ordinal = 0;

  try {
    // 1. Blueprint (if not already present).
    await setState(jobId, 'PLANNING', 'blueprint', 0.05, 'Designing curriculum…');
    await emit(jobId, courseId, 'blueprint', 'Designing curriculum…', ordinal++);

    const existingUnits = listUnits(courseId);
    let blueprint: CurriculumBlueprint;
    if (existingUnits.length > 0) {
      // Blueprint already persisted; reconstruct approximate blueprint.
      blueprint = reconstructBlueprint(courseId);
    } else {
      blueprint = await generateBlueprint(courseId);
      await persistBlueprint(courseId, blueprint);
    }
    await emit(jobId, courseId, 'blueprint', 'Building prerequisite graph…', ordinal++);

    // 2. Generate lessons per unit/objective.
    const units = listUnits(courseId);
    const objectives = listObjectives(courseId);

    const totalObjectives = Math.max(objectives.length, 1);
    let doneObjectives = 0;

    await setState(jobId, 'GENERATING', 'lessons', 0.15, 'Generating lessons…');

    for (const unit of units) {
      const unitObjectives = objectives.filter((o) => o.unitId === unit.id);
      if (unitObjectives.length === 0) continue;

      await emit(jobId, courseId, 'lessons', `Generating ${unit.title}…`, ordinal++);

      // One lesson per objective (simplified: group objectives per lesson).
      for (const obj of unitObjectives) {
        const lessonContent = await generateLesson(courseId, unit.id, [obj.id], undefined, unitObjectives.indexOf(obj));
        persistLesson(courseId, unit.id, undefined, unitObjectives.indexOf(obj), [obj.id], lessonContent);
        doneObjectives++;
        const progress = 0.15 + 0.5 * (doneObjectives / totalObjectives);
        await setState(jobId, 'GENERATING', 'lessons', progress, `Generating lesson ${doneObjectives}/${totalObjectives}…`);
      }
    }

    // 3. Practice for EVERY objective (no artificial cap — cost control comes
    //    from bounded parallelism + caching at the AI layer, never by dropping
    //    objectives).
    await setState(jobId, 'GENERATING', 'practice', 0.72, 'Generating practice…');
    await emit(jobId, courseId, 'practice', 'Generating practice sets…', ordinal++);

    let donePractice = 0;
    for (const obj of objectives) {
      const practice = await generatePractice(courseId, obj.id);
      persistPracticeSet(courseId, obj.id, undefined, practice);
      donePractice++;
      const progress = 0.72 + 0.1 * (donePractice / Math.max(objectives.length, 1));
      await setState(jobId, 'GENERATING', 'practice', progress, `Practice ${donePractice}/${objectives.length}…`);
    }

    await setState(jobId, 'GENERATING', 'assessments', 0.82, 'Generating assessments…');
    await emit(jobId, courseId, 'assessments', 'Generating assessments…', ordinal++);

    const unitObjectiveIds = objectives.map((o) => o.id);
    if (unitObjectiveIds.length > 0) {
      const assessment = await generateAssessment(courseId, unitObjectiveIds, 'unit');
      persistAssessment(courseId, undefined, assessment);
    }

    // 4. QA + bounded, targeted revision loop.
    let qa = await runQa(courseId, jobId, 1);
    let revisionPass = 0;
    const MAX_REVISION_PASSES = 3;

    while (qa.autoFixable > 0 && revisionPass < MAX_REVISION_PASSES) {
      revisionPass++;
      await setState(jobId, 'REVISING', 'revision', 0.9 + 0.08 * revisionPass, `Fixing ${qa.autoFixable} issue(s)… (pass ${revisionPass})`);
      await emit(jobId, courseId, 'revision', `QA found ${qa.autoFixable} auto-fixable issue(s). Repairing (pass ${revisionPass})…`, ordinal++);

      const repair = await repairQaFailures(courseId, qa.autoFixableChecks);
      await emit(
        jobId, courseId, 'revision',
        `Repaired ${repair.repaired} issue(s), skipped ${repair.skipped}.`,
        ordinal++,
      );

      // Re-run QA on the impacted curriculum.
      qa = await runQa(courseId, jobId, revisionPass + 1);
    }

    if (qa.autoFixable > 0 && revisionPass >= MAX_REVISION_PASSES) {
      await emit(jobId, courseId, 'revision', `Revision bound reached; ${qa.autoFixable} issue(s) remain (may need manual review).`, ordinal++, 'warn');
    }

    // 6. Done.
    await setState(jobId, 'COMPLETED', 'complete', 1.0, 'Course ready.');
    updateGenerationJob(jobId, {
      state: 'COMPLETED',
      stage: 'complete',
      progress: 1,
      finishedAt: Date.now(),
      result: JSON.stringify({ qa, blueprint }),
    });
    await emit(jobId, courseId, 'complete', 'Course ready.', ordinal++);
  } catch (err) {
    await setState(jobId, 'FAILED', 'failed', 0, `Generation failed: ${(err as Error).message}`);
    updateGenerationJob(jobId, { state: 'FAILED', finishedAt: Date.now(), error: (err as Error).message });
    await emit(jobId, courseId, 'failed', `Failed: ${(err as Error).message}`, ordinal++, 'error');
    throw pipelineFailed(`Generation failed: ${(err as Error).message}`);
  }
}

/**
 * Reconstruct a lightweight blueprint from already-persisted entities.
 */
function reconstructBlueprint(courseId: string): CurriculumBlueprint {
  const units = listUnits(courseId);
  const objectives = listObjectives(courseId);
  return {
    title: 'Course',
    description: '',
    intendedLearner: '',
    assumedKnowledge: '',
    units: units.map((u) => ({
      title: u.title,
      description: u.description ?? undefined,
      classification: (u.classification as CurriculumBlueprint['units'][number]['classification']) ?? 'REQUIRED',
      topics: [],
      objectives: objectives
        .filter((o) => o.unitId === u.id)
        .map((o) => ({
          statement: o.statement,
          category: o.category,
          difficulty: o.difficulty,
          importance: o.importance,
          classification: (o.classification as 'REQUIRED' | 'PREREQUISITE' | 'RECOMMENDED' | 'ENRICHMENT') ?? 'REQUIRED',
          prerequisites: [],
        })),
      estimatedMinutes: u.estimatedMinutes ?? undefined,
    })),
    prerequisites: [],
    classifications: {
      required: objectives.filter((o) => o.classification === 'REQUIRED').map((o) => o.id),
      prerequisite: objectives.filter((o) => o.classification === 'PREREQUISITE').map((o) => o.id),
      recommended: objectives.filter((o) => o.classification === 'RECOMMENDED').map((o) => o.id),
      enrichment: objectives.filter((o) => o.classification === 'ENRICHMENT').map((o) => o.id),
    },
  };
}

/**
 * Execute a REGENERATE_LESSON job.
 */
export async function executeRegenerateLessonJob(jobId: string, courseId: string, lessonId: string): Promise<void> {
  await setState(jobId, 'GENERATING', 'lesson_regeneration', 0.1, 'Regenerating lesson…');
  await emit(jobId, courseId, 'lesson_regeneration', 'Regenerating lesson…', 0);

  try {
    const lesson = getLesson(lessonId);
    if (!lesson) throw pipelineFailed(`Lesson ${lessonId} not found`);
    if (lesson.courseId !== courseId) throw pipelineFailed(`Lesson ${lessonId} does not belong to this course`);

    const objectiveIds = JSON.parse(lesson.objectiveIds ?? '[]') as string[];
    if (objectiveIds.length === 0) throw pipelineFailed('Lesson has no associated objectives');

    await setState(jobId, 'GENERATING', 'lesson_regeneration', 0.5, 'Generating new lesson content…');
    await emit(jobId, courseId, 'lesson_regeneration', 'Generating new lesson content…', 1);

    const lessonContent = await generateLesson(courseId, lesson.unitId, objectiveIds, lesson.topicId ?? undefined, lesson.ordinal);
    persistLesson(courseId, lesson.unitId, lesson.topicId ?? undefined, lesson.ordinal, objectiveIds, lessonContent);

    await setState(jobId, 'COMPLETED', 'lesson_regeneration', 1.0, 'Lesson regenerated.');
    updateGenerationJob(jobId, {
      state: 'COMPLETED',
      stage: 'lesson_regeneration',
      progress: 1,
      finishedAt: Date.now(),
      result: JSON.stringify({ lessonId }),
    });
    await emit(jobId, courseId, 'lesson_regeneration', 'Lesson regenerated.', 2);
  } catch (err) {
    await setState(jobId, 'FAILED', 'lesson_regeneration', 0, `Lesson regeneration failed: ${(err as Error).message}`);
    updateGenerationJob(jobId, {
      state: 'FAILED',
      finishedAt: Date.now(),
      error: (err as Error).message,
    });
    throw pipelineFailed(`Lesson regeneration failed: ${(err as Error).message}`);
  }
}

/**
 * Execute a QA job.
 */
export async function executeQaJob(jobId: string, courseId: string): Promise<void> {
  await setState(jobId, 'VALIDATING', 'qa', 0.1, 'Running QA checks…');
  await emit(jobId, courseId, 'qa', 'Running QA checks…', 0);

  try {
    await setState(jobId, 'VALIDATING', 'qa', 0.5, 'Running deterministic checks…');
    await emit(jobId, courseId, 'qa', 'Running deterministic checks…', 1);

    const qa = await runQa(courseId, jobId, 1);

    await setState(jobId, 'COMPLETED', 'qa', 1.0, 'QA completed.');
    updateGenerationJob(jobId, {
      state: 'COMPLETED',
      stage: 'qa',
      progress: 1,
      finishedAt: Date.now(),
      result: JSON.stringify(qa),
    });
    await emit(jobId, courseId, 'qa', `QA completed: ${qa.totalChecks} checks, ${qa.failedChecks} failed.`, 2);
  } catch (err) {
    await setState(jobId, 'FAILED', 'qa', 0, `QA failed: ${(err as Error).message}`);
    updateGenerationJob(jobId, {
      state: 'FAILED',
      finishedAt: Date.now(),
      error: (err as Error).message,
    });
    throw pipelineFailed(`QA failed: ${(err as Error).message}`);
  }
}

/**
 * Execute a REVISE job (targeted revision based on QA failures).
 */
export async function executeReviseJob(jobId: string, courseId: string, runNumber = 1): Promise<void> {
  await setState(jobId, 'REVISING', 'revision', 0.1, 'Running targeted revisions…');
  await emit(jobId, courseId, 'revision', 'Running targeted revisions…', 0);

  try {
    // Get the latest QA results to find auto-fixable failures
    const qa = await runQa(courseId, jobId, runNumber);

    if (qa.autoFixable === 0) {
      await setState(jobId, 'COMPLETED', 'revision', 1.0, 'No auto-fixable issues found.');
      updateGenerationJob(jobId, {
        state: 'COMPLETED',
        stage: 'revision',
        progress: 1,
        finishedAt: Date.now(),
        result: JSON.stringify({ message: 'No auto-fixable issues found' }),
      });
      await emit(jobId, courseId, 'revision', 'No auto-fixable issues found.', 1);
      return;
    }

    await setState(jobId, 'REVISING', 'revision', 0.5, `Fixing ${qa.autoFixable} auto-fixable issue(s)…`);
    await emit(jobId, courseId, 'revision', `Fixing ${qa.autoFixable} auto-fixable issue(s)…`, 1);

    const repair = await repairQaFailures(courseId, qa.autoFixableChecks);

    await setState(jobId, 'COMPLETED', 'revision', 1.0, 'Revision completed.');
    updateGenerationJob(jobId, {
      state: 'COMPLETED',
      stage: 'revision',
      progress: 1,
      finishedAt: Date.now(),
      result: JSON.stringify(repair),
    });
    await emit(jobId, courseId, 'revision', `Repaired ${repair.repaired} issue(s), skipped ${repair.skipped}.`, 2);
  } catch (err) {
    await setState(jobId, 'FAILED', 'revision', 0, `Revision failed: ${(err as Error).message}`);
    updateGenerationJob(jobId, {
      state: 'FAILED',
      finishedAt: Date.now(),
      error: (err as Error).message,
    });
    throw pipelineFailed(`Revision failed: ${(err as Error).message}`);
  }
}

/**
 * Generic dispatcher: run a job by its kind.
 */
export async function runJob(jobId: string): Promise<void> {
  const job = getGenerationJob(jobId);
  if (!job) throw pipelineFailed(`Job ${jobId} not found`);

  // Mark started.
  updateGenerationJob(jobId, {
    state: job.kind === 'ANALYZE_SOURCE' ? 'ANALYZING' : 'QUEUED',
    startedAt: Date.now(),
    attempts: job.attempts + 1,
  });

  const input = job.input ? JSON.parse(job.input) : {};

  switch (job.kind) {
    case 'ANALYZE_SOURCE': {
      const docIds: string[] = Array.isArray(input.documentIds)
        ? input.documentIds
        : input.documentId
          ? [input.documentId]
          : [];
      await executeAnalyzeSourceJob(jobId, job.courseId, docIds);
      break;
    }
    case 'BLUEPRINT':
      await executeBlueprintJob(jobId, job.courseId);
      break;
    case 'GENERATE_COURSE':
      await executeGenerateCourseJob(jobId, job.courseId);
      break;
    case 'REGENERATE_LESSON': {
      const lessonId = input.lessonId;
      if (!lessonId) throw pipelineFailed('REGENERATE_LESSON job requires lessonId in input');
      await executeRegenerateLessonJob(jobId, job.courseId, lessonId);
      break;
    }
    case 'QA':
      await executeQaJob(jobId, job.courseId);
      break;
    case 'REVISE': {
      const runNumber = input.runNumber ?? 1;
      await executeReviseJob(jobId, job.courseId, runNumber);
      break;
    }
    default:
      throw pipelineFailed(`Unsupported job kind: ${job.kind}`);
  }
}

/** Get current job progress for the UI. */
export function getJobProgress(jobId: string): JobProgress | null {
  const job = getGenerationJob(jobId);
  if (!job) return null;
  return {
    jobId: job.id,
    state: job.state as JobState,
    stage: job.stage ?? '',
    progress: job.progress,
    message: job.message ?? '',
  };
}