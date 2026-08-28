/**
 * Course versioning & publishing service.
 *
 * Snapshots the entire live curriculum (units, topics, objectives,
 * dependencies, lessons, activities, practice sets, assessments, questions,
 * provenance) into an immutable JSON blob, and supports atomic publish and
 * restore semantics on top of it.
 */
import {
  getDb,
} from '../db';
import {
  getCourse,
  getCourseVersion,
  listCourseVersions,
  listUnits,
  listTopics,
  listObjectives,
  listDependencies,
  listLessons,
  listActivitiesForLesson,
  listPracticeSets,
  listAssessments,
  listQuestions,
  listProvenance,
  createUnit,
  createTopic,
  createObjective,
  createDependency,
  createLesson,
  createActivity,
  createPracticeSet,
  createAssessment,
  createQuestion,
  createProvenance,
  deleteUnitsByCourse,
  deleteTopicsByCourse,
  deleteObjectivesByCourse,
  deleteDependenciesByCourse,
  deleteLessonsByCourse,
  deleteActivitiesByCourse,
  deletePracticeSetsByCourse,
  deleteAssessmentsByCourse,
  deleteQuestionsByCourse,
  deleteProvenanceByCourse,
} from '../db/repo';
import { newId } from '../lib/ids';
import { notFound, conflict } from '../lib/errors';
import { eq } from 'drizzle-orm';
import { courseVersions, courses } from '../db/schema';

/** Shape of a full curriculum snapshot persisted in courseVersions.snapshot. */
export interface CurriculumSnapshot {
  courseId: string;
  createdAt: number;
  units: Record<string, unknown>[];
  topics: Record<string, unknown>[];
  objectives: Record<string, unknown>[];
  dependencies: Record<string, unknown>[];
  lessons: Record<string, unknown>[];
  activities: Record<string, unknown>[];
  practiceSets: Record<string, unknown>[];
  assessments: Record<string, unknown>[];
  questions: Record<string, unknown>[];
  provenance: Record<string, unknown>[];
}

type Row = Record<string, unknown>;

/** Gather every curriculum entity for a course into a plain JSON snapshot. */
function collectSnapshot(courseId: string): CurriculumSnapshot {
  const units = listUnits(courseId);
  const lessons = listLessons(courseId);

  const activities: Row[] = [];
  for (const lesson of lessons) {
    activities.push(...listActivitiesForLesson(lesson.id as string));
  }

  return {
    courseId,
    createdAt: Date.now(),
    units: units as unknown as Row[],
    topics: listTopics(courseId) as unknown as Row[],
    objectives: listObjectives(courseId) as unknown as Row[],
    dependencies: listDependencies(courseId) as unknown as Row[],
    lessons: lessons as unknown as Row[],
    activities,
    practiceSets: listPracticeSets(courseId) as unknown as Row[],
    assessments: listAssessments(courseId) as unknown as Row[],
    questions: listQuestions(courseId) as unknown as Row[],
    provenance: listProvenance(courseId) as unknown as Row[],
  };
}

function parseSnapshot(raw: string): CurriculumSnapshot {
  return JSON.parse(raw) as CurriculumSnapshot;
}

/* ------------------------------------------------------------ create ---- */

export interface CreateVersionResult {
  version: Record<string, unknown>;
  versionNumber: number;
}

/**
 * Snapshot the current curriculum into a new draft version and point
 * `courses.currentVersionId` at it. `versionNumber` is strictly max+1 inside a
 * transaction to avoid races between concurrent creators.
 */
export function createVersion(
  courseId: string,
  userId: string,
  input: { label?: string; notes?: string } = {},
): CreateVersionResult {
  const course = getCourse(courseId);
  if (!course) throw notFound('Course not found');
  if (course.userId !== userId) throw notFound('Course not found');

  const snapshot = collectSnapshot(courseId);

  const result = getDb().transaction((tx) => {
    const latest = tx
      .select()
      .from(courseVersions)
      .where(eq(courseVersions.courseId, courseId))
      .orderBy(courseVersions.versionNumber)
      .all();
    let maxVersion = 0;
    for (const v of latest) {
      if ((v.versionNumber ?? 0) > maxVersion) maxVersion = v.versionNumber;
    }

    const versionNumber = maxVersion + 1;
    const versionId = newId('ver');

    tx.insert(courseVersions)
      .values({
        id: versionId,
        courseId,
        versionNumber,
        label: input.label ?? null,
        notes: input.notes ?? null,
        snapshot: JSON.stringify(snapshot),
        status: 'draft',
      })
      .run();

    tx.update(courses)
      .set({ currentVersionId: versionId, updatedAt: Date.now() })
      .where(eq(courses.id, courseId))
      .run();

    const created = tx
      .select()
      .from(courseVersions)
      .where(eq(courseVersions.id, versionId))
      .get();

    return { version: created, versionNumber };
  });

  return result as CreateVersionResult;
}

/* ----------------------------------------------------------- publish ---- */

/**
 * Atomically publish a version: set its status to 'published', supersede all
 * other versions, and mark the course published. Publishing is immutable.
 */
export function publishVersion(
  courseId: string,
  versionId: string,
  userId: string,
): Record<string, unknown> {
  const course = getCourse(courseId);
  if (!course) throw notFound('Course not found');
  if (course.userId !== userId) throw notFound('Course not found');

  const version = getCourseVersion(versionId);
  if (!version || version.courseId !== courseId) throw notFound('Version not found');
  if (version.status === 'published') throw conflict('Version already published');

  const now = Date.now();
  getDb().transaction((tx) => {
    tx.update(courseVersions)
      .set({ status: 'published', publishedAt: now })
      .where(eq(courseVersions.id, versionId))
      .run();

    tx.update(courseVersions)
      .set({ status: 'superseded' })
      .where(eq(courseVersions.courseId, courseId))
      .run();

    // The published one must not be overwritten by the supersede sweep above;
    // SQLite has no per-row exclusion, so re-assert its published status.
    tx.update(courseVersions)
      .set({ status: 'published', publishedAt: now })
      .where(eq(courseVersions.id, versionId))
      .run();

    tx.update(courses)
      .set({ status: 'published', currentVersionId: versionId, updatedAt: now })
      .where(eq(courses.id, courseId))
      .run();
  });

  return getCourseVersion(versionId) as unknown as Record<string, unknown>;
}

/* ----------------------------------------------------------- restore ---- */

/**
 * Restore a snapshot's curriculum back into the live working tables. Existing
 * live entities are replaced (deleted + re-inserted with fresh ids), while the
 * snapshot itself is left untouched. Provenance references are remapped to the
 * new entity ids.
 */
export function restoreVersion(
  courseId: string,
  versionId: string,
  userId: string,
): void {
  const course = getCourse(courseId);
  if (!course) throw notFound('Course not found');
  if (course.userId !== userId) throw notFound('Course not found');

  const version = getCourseVersion(versionId);
  if (!version || version.courseId !== courseId) throw notFound('Version not found');
  if (!version.snapshot) throw notFound('Version has no snapshot');

  const snap = parseSnapshot(version.snapshot);

  getDb().transaction(() => {
    // Clear existing live curriculum for this course.
    deleteProvenanceByCourse(courseId);
    deleteQuestionsByCourse(courseId);
    deletePracticeSetsByCourse(courseId);
    deleteAssessmentsByCourse(courseId);
    deleteActivitiesByCourse(courseId);
    deleteLessonsByCourse(courseId);
    deleteDependenciesByCourse(courseId);
    deleteObjectivesByCourse(courseId);
    deleteTopicsByCourse(courseId);
    deleteUnitsByCourse(courseId);

    // Re-insert with fresh ids, remapping old -> new for FK references.
    const unitIdMap = new Map<string, string>();
    const topicIdMap = new Map<string, string>();
    const objectiveIdMap = new Map<string, string>();
    const lessonIdMap = new Map<string, string>();
    const practiceSetIdMap = new Map<string, string>();
    const assessmentIdMap = new Map<string, string>();

    for (const row of snap.units) {
      const oldId = row.id as string;
      const id = newId('unt');
      unitIdMap.set(oldId, id);
      createUnit({
        id,
        courseId,
        ordinal: row.ordinal as number,
        title: row.title as string,
        description: row.description as string | undefined,
        classification: row.classification as string | undefined,
        estimatedMinutes: row.estimatedMinutes as number | undefined,
        origin: (row.origin as string) ?? 'AI_GENERATED',
      });
    }

    for (const row of snap.topics) {
      const oldId = row.id as string;
      const id = newId('top');
      topicIdMap.set(oldId, id);
      createTopic({
        id,
        courseId,
        unitId: unitIdMap.get(row.unitId as string) ?? (row.unitId as string),
        ordinal: row.ordinal as number,
        title: row.title as string,
        description: row.description as string | undefined,
        classification: row.classification as string | undefined,
        origin: (row.origin as string) ?? 'AI_GENERATED',
      });
    }

    for (const row of snap.objectives) {
      const oldId = row.id as string;
      const id = newId('obj');
      objectiveIdMap.set(oldId, id);
      createObjective({
        id,
        courseId,
        unitId: row.unitId ? unitIdMap.get(row.unitId as string) ?? (row.unitId as string) : undefined,
        topicId: row.topicId ? topicIdMap.get(row.topicId as string) ?? (row.topicId as string) : undefined,
        ordinal: row.ordinal as number,
        code: row.code as string | undefined,
        title: row.title as string,
        statement: row.statement as string,
        category: row.category as string | undefined,
        bloom: row.bloom as string | undefined,
        difficulty: row.difficulty as number | undefined,
        importance: row.importance as number | undefined,
        classification: row.classification as string | undefined,
        masteryCriteria: row.masteryCriteria as string | undefined,
        origin: (row.origin as string) ?? 'AI_GENERATED',
      });
    }

    for (const row of snap.dependencies) {
      createDependency({
        id: newId('dep'),
        courseId,
        objectiveId: objectiveIdMap.get(row.objectiveId as string) ?? (row.objectiveId as string),
        prerequisiteId: objectiveIdMap.get(row.prerequisiteId as string) ?? (row.prerequisiteId as string),
        strength: row.strength as string | undefined,
        rationale: row.rationale as string | undefined,
      });
    }

    for (const row of snap.lessons) {
      const oldId = row.id as string;
      const id = newId('les');
      lessonIdMap.set(oldId, id);
      createLesson({
        id,
        courseId,
        unitId: unitIdMap.get(row.unitId as string) ?? (row.unitId as string),
        topicId: row.topicId ? topicIdMap.get(row.topicId as string) ?? (row.topicId as string) : undefined,
        ordinal: row.ordinal as number,
        title: row.title as string,
        summary: row.summary as string | undefined,
        objectiveIds: row.objectiveIds as string | undefined,
        domainTemplate: row.domainTemplate as string | undefined,
        content: row.content as string | undefined,
        estimatedMinutes: row.estimatedMinutes as number | undefined,
        classification: row.classification as string | undefined,
        status: row.status as string | undefined,
        origin: (row.origin as string) ?? 'AI_GENERATED',
      });
    }

    for (const row of snap.activities) {
      createActivity({
        id: newId('act'),
        courseId,
        lessonId: lessonIdMap.get(row.lessonId as string) ?? (row.lessonId as string),
        ordinal: row.ordinal as number,
        kind: row.kind as string,
        title: row.title as string,
        payload: row.payload as string | undefined,
        origin: (row.origin as string) ?? 'AI_GENERATED',
      });
    }

    for (const row of snap.practiceSets) {
      const oldId = row.id as string;
      const id = newId('set');
      practiceSetIdMap.set(oldId, id);
      createPracticeSet({
        id,
        courseId,
        objectiveId: row.objectiveId ? objectiveIdMap.get(row.objectiveId as string) ?? (row.objectiveId as string) : undefined,
        lessonId: row.lessonId ? lessonIdMap.get(row.lessonId as string) ?? (row.lessonId as string) : undefined,
        ordinal: row.ordinal as number | undefined,
        title: row.title as string,
        level: row.level as string | undefined,
        origin: (row.origin as string) ?? 'AI_GENERATED',
      });
    }

    for (const row of snap.assessments) {
      const oldId = row.id as string;
      const id = newId('asm');
      assessmentIdMap.set(oldId, id);
      createAssessment({
        id,
        courseId,
        unitId: row.unitId ? unitIdMap.get(row.unitId as string) ?? (row.unitId as string) : undefined,
        kind: row.kind as string,
        title: row.title as string,
        instructions: row.instructions as string | undefined,
        objectiveIds: row.objectiveIds as string | undefined,
        passThreshold: row.passThreshold as number | undefined,
        ordinal: row.ordinal as number | undefined,
        origin: (row.origin as string) ?? 'AI_GENERATED',
      });
    }

    for (const row of snap.questions) {
      createQuestion({
        id: newId('qst'),
        courseId,
        objectiveId: row.objectiveId ? objectiveIdMap.get(row.objectiveId as string) ?? (row.objectiveId as string) : undefined,
        lessonId: row.lessonId ? lessonIdMap.get(row.lessonId as string) ?? (row.lessonId as string) : undefined,
        practiceSetId: row.practiceSetId ? practiceSetIdMap.get(row.practiceSetId as string) ?? (row.practiceSetId as string) : undefined,
        assessmentId: row.assessmentId ? assessmentIdMap.get(row.assessmentId as string) ?? (row.assessmentId as string) : undefined,
        ordinal: row.ordinal as number | undefined,
        kind: row.kind as string,
        level: row.level as string | undefined,
        prompt: row.prompt as string,
        choices: row.choices as string | undefined,
        answerKey: row.answerKey as string | undefined,
        explanation: row.explanation as string | undefined,
        misconceptions: row.misconceptions as string | undefined,
        expectedSkill: row.expectedSkill as string | undefined,
        difficulty: row.difficulty as number | undefined,
        origin: (row.origin as string) ?? 'AI_GENERATED',
      });
    }

    for (const row of snap.provenance) {
      const oldEntityId = row.entityId as string;
      const entityType = row.entityType as string;
      const remapTarget: Record<string, Map<string, string>> = {
        unit: unitIdMap,
        topic: topicIdMap,
        objective: objectiveIdMap,
        lesson: lessonIdMap,
      };
      const entityId = remapTarget[entityType]?.get(oldEntityId) ?? oldEntityId;
      createProvenance({
        id: newId('prv'),
        courseId,
        entityType,
        entityId,
        fragmentId: row.fragmentId as string | undefined,
        documentId: row.documentId as string | undefined,
        relation: row.relation as string,
        confidence: row.confidence as number | undefined,
        note: row.note as string | undefined,
      });
    }
  });
}

/* ----------------------------------------------------------- listing ---- */

export function listVersions(
  courseId: string,
  userId: string,
): Array<Record<string, unknown>> {
  const course = getCourse(courseId);
  if (!course) throw notFound('Course not found');
  if (course.userId !== userId) throw notFound('Course not found');

  const versions = listCourseVersions(courseId);
  return versions.map((v) => ({
    ...v,
    isCurrent: v.id === course.currentVersionId,
  }));
}

/* ------------------------------------------------------------ compare ---- */

export interface VersionDiff {
  units: { added: number; removed: number; changed: number };
  objectives: { added: number; removed: number; changed: number };
}

/**
 * Structural diff between two snapshots: counts units/objectives that were
 * added, removed, or changed by title/statement.
 */
export function compareVersions(
  courseId: string,
  v1: string,
  v2: string,
  userId: string,
): VersionDiff {
  const course = getCourse(courseId);
  if (!course) throw notFound('Course not found');
  if (course.userId !== userId) throw notFound('Course not found');

  const a = getCourseVersion(v1);
  const b = getCourseVersion(v2);
  if (!a || a.courseId !== courseId) throw notFound('Version not found');
  if (!b || b.courseId !== courseId) throw notFound('Version not found');
  if (!a.snapshot || !b.snapshot) throw notFound('Version has no snapshot');

  const sa = parseSnapshot(a.snapshot);
  const sb = parseSnapshot(b.snapshot);

  return {
    units: diffByKey(sa.units, sb.units, 'title'),
    objectives: diffByKey(sa.objectives, sb.objectives, 'statement'),
  };
}

function diffByKey(
  before: Row[],
  after: Row[],
  key: string,
): { added: number; removed: number; changed: number } {
  const beforeKeys = new Set(before.map((r) => String(r[key])));
  const afterKeys = new Set(after.map((r) => String(r[key])));

  const added = after.filter((r) => !beforeKeys.has(String(r[key]))).length;
  const removed = before.filter((r) => !afterKeys.has(String(r[key]))).length;

  // "changed" = same key present in both but other fields differ.
  const beforeByKey = new Map(before.map((r) => [String(r[key]), r]));
  const afterByKey = new Map(after.map((r) => [String(r[key]), r]));
  let changed = 0;
  for (const [k, bRow] of beforeByKey) {
    const aRow = afterByKey.get(k);
    if (aRow && JSON.stringify(bRow) !== JSON.stringify(aRow)) changed += 1;
  }

  return { added, removed, changed };
}