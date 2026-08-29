/**
 * CourseGenerationService — generate the full curriculum from a blueprint.
 *
 * Stages:
 *   1. Curriculum blueprint (planning model)
 *   2. Prerequisite/dependency analysis
 *   3. Units & objectives persisted
 *   4. Lessons (generation model)
 *   5. Practice (generation model)
 *   6. Assessments (assessment model)
 *
 * Each stage uses the model-router to select the right NIM model. Source
 * material is delimited; classification (REQUIRED/ENRICHMENT) is preserved.
 */
import { randomUUID } from 'node:crypto';
import { getAiContext } from '../ai';
import { generateStructured, resolveModel } from '../ai/router';
import {
  CurriculumBlueprint,
  CurriculumBlueprintSchema,
  LessonContent,
  LessonContentSchema,
  PracticeSet,
  PracticeSetSchema,
  Assessment,
  AssessmentSchema,
  DetectedObjective,
  SourceAnalysis,
} from '../ai/types';
import {
  BLUEPRINT_SYSTEM,
  LESSON_SYSTEM,
  PRACTICE_SYSTEM,
  ASSESSMENT_SYSTEM,
  delimitSource,
} from '../pipeline/prompts';
import {
  getLatestKnowledgePackage,
  createUnit,
  createTopic,
  createObjective,
  createDependency,
  createLesson,
  createPracticeSet,
  createAssessment,
  createQuestion,
  createProvenance,
  updateProvenance,
  getObjective,
  listProvenance,
} from '../db/repo';
import { pipelineFailed } from '../lib/errors';
import { contentHash } from '../lib/ids';

/* ------------------------------------------------------------ blueprint ---- */

export async function generateBlueprint(courseId: string): Promise<CurriculumBlueprint> {
  const { provider, routing } = getAiContext();
  const kp = getLatestKnowledgePackage(courseId);
  if (!kp) throw pipelineFailed('No approved source interpretation found.');

  const source = JSON.parse(kp.payload);
  const model = resolveModel(routing, 'curriculum_planning');

  const messages = [
    { role: 'system' as const, content: BLUEPRINT_SYSTEM },
    {
      role: 'user' as const,
      content: `Accepted source interpretation:\n${delimitSource(JSON.stringify(source, null, 2))}`,
    },
  ];

  const result = await generateStructured(
    provider,
    model,
    { messages, schema: CurriculumBlueprintSchema },
    { maxRetries: 2, temperature: 0.3 },
  );

  return result.value;
}

/* ------------------------------------------------- prerequisite & units ---- */

/**
 * Persist the blueprint as normalized entities (units, topics, objectives,
 * dependencies) with provenance links back to the knowledge package.
 */
export async function persistBlueprint(courseId: string, blueprint: CurriculumBlueprint): Promise<void> {
  const kp = getLatestKnowledgePackage(courseId);

  const unitIdMap = new Map<number, string>();
  const objectiveIdMap = new Map<string, { dbId: string; ordinal: number }>();

  // Units + topics.
  for (const [u, unit] of blueprint.units.entries()) {
    const unitId = `unit_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
    unitIdMap.set(u, unitId);

    createUnit({
      id: unitId,
      courseId,
      ordinal: u,
      title: unit.title,
      description: unit.description,
      classification: unit.classification,
      estimatedMinutes: unit.estimatedMinutes,
      origin: 'AI_GENERATED',
    });

    for (const [t, topic] of unit.topics.entries()) {
      createTopic({
        id: `topic_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
        courseId,
        unitId,
        ordinal: t,
        title: topic.title,
        description: topic.description,
        classification: topic.classification,
        origin: 'AI_GENERATED',
      });
    }

    // Objectives.
    for (const [o, obj] of unit.objectives.entries()) {
      const objectiveId = `obj_${randomUUID().replace(/-/g, '').slice(0, 24)}`;
      const code = obj.id ?? `U${u + 1}.O${o + 1}`;
      createObjective({
        id: objectiveId,
        courseId,
        unitId,
        ordinal: o,
        code,
        title: obj.statement.slice(0, 60),
        statement: obj.statement,
        category: obj.category,
        difficulty: obj.difficulty,
        importance: obj.importance,
        classification: obj.classification,
        origin: 'AI_GENERATED',
      });
      objectiveIdMap.set(code, { dbId: objectiveId, ordinal: o });

      // Provenance from knowledge package.
      if (kp) {
        createProvenance({
          id: `prov_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
          courseId,
          entityType: 'objective',
          entityId: objectiveId,
          relation: 'DERIVED_FROM',
          note: 'Derived from approved source interpretation.',
        });
      }
    }

    // Update provenance records for this unit's objectives to link to source fragments.
    // The source analysis created provenance with synthetic IDs (hashObjective).
    // We need to map those to the actual database IDs we just created.
    if (kp) {
      const kpPayload = JSON.parse(kp.payload) as SourceAnalysis;
      
      // For each objective in this unit, find matching source analysis objective
      // and update provenance entityId from synthetic to real ID.
      for (const [o, obj] of unit.objectives.entries()) {
        // Find matching source analysis objective by statement
        const sourceObj = kpPayload.objectives.find(
          (so: DetectedObjective) => so.statement === obj.statement
        );
        const code = obj.id ?? `U${u + 1}.O${o + 1}`;
        if (sourceObj) {
          const syntheticId = `obj_${contentHash(kpPayload.title, sourceObj.statement)}`;
          const realId = objectiveIdMap.get(code)?.dbId;
          
          if (realId && syntheticId !== realId) {
            // Update provenance records that reference the synthetic ID
            const provenanceRecords = listProvenance(courseId);
            for (const prov of provenanceRecords) {
              if (prov.entityType === 'objective' && prov.entityId === syntheticId) {
                // Update the existing provenance record to point to the real entity ID
                updateProvenance(prov.id, { entityId: realId });
              }
            }
          }
        }
      }
    }
  }

  // Dependencies.
  for (const edge of blueprint.prerequisites) {
    const from = objectiveIdMap.get(edge.objectiveId);
    const to = objectiveIdMap.get(edge.prerequisiteId);
    if (from && to && from.dbId !== to.dbId) {
      createDependency({
        id: `dep_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
        courseId,
        objectiveId: from.dbId,
        prerequisiteId: to.dbId,
        strength: edge.strength,
        rationale: edge.rationale,
      });
    }
  }
}

/* ---------------------------------------------------------------- lesson ---- */

export async function generateLesson(
  courseId: string,
  unitId: string,
  objectiveIds: string[],
  topicId?: string,
  _ordinal = 0,
): Promise<LessonContent> {
  const { provider, routing } = getAiContext();
  const model = resolveModel(routing, 'lesson_generation');

  const objectiveStmts = objectiveIds
    .map((id) => getObjectiveStatement(id))
    .filter(Boolean);

  const messages = [
    { role: 'system' as const, content: LESSON_SYSTEM },
    {
      role: 'user' as const,
      content: `Generate a lesson aligned to these learning objectives:\n${objectiveStmts.join('\n')}`,
    },
  ];

  const result = await generateStructured(
    provider,
    model,
    { messages, schema: LessonContentSchema },
    { maxRetries: 2, temperature: 0.4 },
  );

  return result.value;
}

function getObjectiveStatement(objectiveId: string): string {
  const obj = getObjective(objectiveId);
  return obj?.statement ?? objectiveId;
}

/* ------------------------------------------------------- practice & assess ---- */

export async function generatePractice(
  courseId: string,
  objectiveId: string,
): Promise<PracticeSet> {
  const { provider, routing } = getAiContext();
  const model = resolveModel(routing, 'practice_generation');

  const messages = [
    { role: 'system' as const, content: PRACTICE_SYSTEM },
    {
      role: 'user' as const,
      content: `Generate progressive practice for this objective:\n${getObjectiveStatement(objectiveId)}`,
    },
  ];

  const result = await generateStructured(
    provider,
    model,
    { messages, schema: PracticeSetSchema },
    { maxRetries: 2, temperature: 0.4 },
  );

  return result.value;
}

export async function generateAssessment(
  courseId: string,
  objectiveIds: string[],
  kind: string = 'unit',
): Promise<Assessment> {
  const { provider, routing } = getAiContext();
  const model = resolveModel(routing, 'assessment_generation');

  const statements = objectiveIds.map((id) => getObjectiveStatement(id)).filter(Boolean);

  const messages = [
    { role: 'system' as const, content: ASSESSMENT_SYSTEM },
    {
      role: 'user' as const,
      content: `Generate a ${kind} assessment for these objectives:\n${statements.join('\n')}`,
    },
  ];

  const result = await generateStructured(
    provider,
    model,
    { messages, schema: AssessmentSchema },
    { maxRetries: 2, temperature: 0.2 },
  );

  return result.value;
}

/* ----------------------------------------------------------- persistence ---- */

export function persistLesson(
  courseId: string,
  unitId: string,
  topicId: string | undefined,
  ordinal: number,
  objectiveIds: string[],
  content: LessonContent,
) {
  const lesson = createLesson({
    id: `les_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
    courseId,
    unitId,
    topicId,
    ordinal,
    title: content.sections[0]?.title ?? 'Lesson',
    summary: content.summary,
    objectiveIds: JSON.stringify(objectiveIds),
    content: JSON.stringify(content),
    estimatedMinutes: content.estimatedMinutes,
    classification: 'REQUIRED',
    status: 'generated',
    origin: 'AI_GENERATED',
  });

  // Create provenance linking lesson to its objectives
  for (const objId of objectiveIds) {
    createProvenance({
      id: `prov_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
      courseId,
      entityType: 'lesson',
      entityId: lesson.id,
      relation: 'DERIVED_FROM',
      note: `Lesson covering objective ${objId}`,
    });
  }

  return lesson;
}

export function persistPracticeSet(
  courseId: string,
  objectiveId: string | undefined,
  lessonId: string | undefined,
  set: PracticeSet,
) {
  const ps = createPracticeSet({
    id: `ps_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
    courseId,
    objectiveId,
    lessonId,
    title: set.title,
    level: set.level,
    origin: 'AI_GENERATED',
  });

  // Create provenance linking practice set to its objective
  if (objectiveId) {
    createProvenance({
      id: `prov_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
      courseId,
      entityType: 'practice_set',
      entityId: ps.id,
      relation: 'DERIVED_FROM',
      note: `Practice set for objective ${objectiveId}`,
    });
  }

  let ordinal = 0;
  for (const q of set.questions) {
    const questionOrdinal = ordinal++;
    const question = createQuestion({
      id: `q_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
      courseId,
      objectiveId,
      practiceSetId: ps.id,
      ordinal: questionOrdinal,
      kind: q.kind,
      level: q.level,
      prompt: q.prompt,
      choices: q.choices ? JSON.stringify(q.choices) : undefined,
      answerKey: q.answerKey ? JSON.stringify(q.answerKey) : undefined,
      explanation: q.explanation,
      misconceptions: q.misconceptions?.length ? JSON.stringify(q.misconceptions) : undefined,
      expectedSkill: q.expectedSkill,
      difficulty: q.difficulty,
      origin: 'AI_GENERATED',
    });

    // Create provenance linking question to its objective
    if (objectiveId) {
      createProvenance({
        id: `prov_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
        courseId,
        entityType: 'question',
        entityId: question.id,
        relation: 'DERIVED_FROM',
        note: `Practice question for objective ${objectiveId}`,
      });
    }
  }
}

export function persistAssessment(
  courseId: string,
  unitId: string | undefined,
  assessment: Assessment,
) {
  const asm = createAssessment({
    id: `asm_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
    courseId,
    unitId,
    kind: assessment.kind,
    title: assessment.title,
    instructions: assessment.instructions,
    objectiveIds: JSON.stringify(assessment.objectiveIds),
    passThreshold: assessment.passThreshold,
    origin: 'AI_GENERATED',
  });

  // Create provenance linking assessment to its objectives
  for (const objId of assessment.objectiveIds) {
    createProvenance({
      id: `prov_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
      courseId,
      entityType: 'assessment',
      entityId: asm.id,
      relation: 'DERIVED_FROM',
      note: `Assessment covering objective ${objId}`,
    });
  }

  let ordinal = 0;
  for (const q of assessment.questions) {
    const question = createQuestion({
      id: `q_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
      courseId,
      assessmentId: asm.id,
      ordinal: ordinal++,
      kind: q.kind,
      level: 'independent',
      prompt: q.prompt,
      choices: q.choices ? JSON.stringify(q.choices) : undefined,
      answerKey: q.answerKey ? JSON.stringify(q.answerKey) : undefined,
      explanation: q.explanation,
      misconceptions: q.misconceptions?.length ? JSON.stringify(q.misconceptions) : undefined,
      expectedSkill: q.expectedSkill,
      difficulty: q.difficulty,
      origin: 'AI_GENERATED',
    });

    // Create provenance linking question to its objectives
    for (const objId of assessment.objectiveIds) {
      createProvenance({
        id: `prov_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
        courseId,
        entityType: 'question',
        entityId: question.id,
        relation: 'DERIVED_FROM',
        note: `Assessment question for objective ${objId}`,
      });
    }
  }
}