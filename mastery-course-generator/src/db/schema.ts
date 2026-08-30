/**
 * Database schema (SQLite via node:sqlite + Drizzle).
 *
 * Design notes
 * ------------
 * - Normalised entities for anything we query, order, join, or aggregate:
 *   units, topics, objectives, lessons, questions, mastery, provenance.
 * - JSON text columns ONLY for genuinely open-ended AI payloads (lesson bodies,
 *   answer keys, misconception lists). The course is never one giant blob.
 * - Timestamps are integer epoch milliseconds: portable and sortable.
 * - `origin` on every generated entity distinguishes AI_GENERATED from
 *   USER_EDITED so regeneration can refuse to clobber human work.
 * - `classification` carries the REQUIRED / PREREQUISITE / RECOMMENDED /
 *   ENRICHMENT distinction end-to-end, so enrichment can never silently
 *   masquerade as source-required material.
 */
import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

const now = () => Date.now();

/* ---------------------------------------------------------------- users ---- */

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    displayName: text('display_name'),
    /** scrypt hash; null for guest and share-link learner accounts. */
    passwordHash: text('password_hash'),
    // teacher | student
    role: text('role').notNull().default('teacher'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
  },
  (t) => [uniqueIndex('users_email_uq').on(t.email)],
);

/* -------------------------------------------------------------- courses ---- */

export const courses = sqliteTable(
  'courses',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    title: text('title').notNull(),
    description: text('description'),
    // mathematics | science | history | programming | language | general
    subjectDomain: text('subject_domain'),
    targetLevel: text('target_level'),
    status: text('status').notNull().default('draft'), // draft | published | archived
    stage: text('stage').notNull().default('CREATED'), // wizard progress marker
    currentVersionId: text('current_version_id'),
    preferences: text('preferences'), // JSON CoursePreferences
    createdAt: integer('created_at').notNull().$defaultFn(now),
    updatedAt: integer('updated_at').notNull().$defaultFn(now),
  },
  (t) => [index('courses_user_idx').on(t.userId)],
);

export const courseVersions = sqliteTable(
  'course_versions',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    versionNumber: integer('version_number').notNull(),
    label: text('label'),
    status: text('status').notNull().default('draft'), // draft | published | superseded
    notes: text('notes'),
    /** Immutable full snapshot, so an earlier version can always be restored. */
    snapshot: text('snapshot'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
    publishedAt: integer('published_at'),
  },
  (t) => [
    index('cv_course_idx').on(t.courseId),
    uniqueIndex('cv_course_number_uq').on(t.courseId, t.versionNumber),
  ],
);

/* --------------------------------------------------------------- sources ---- */

export const sourceDocuments = sqliteTable(
  'source_documents',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    kind: text('kind').notNull(), // text | image | pdf | prompt
    filename: text('filename'),
    mimeType: text('mime_type'),
    byteSize: integer('byte_size'),
    storagePath: text('storage_path'),
    checksum: text('checksum'),
    extractedText: text('extracted_text'),
    pageCount: integer('page_count'),
    // uploaded | extracting | extracted | failed
    status: text('status').notNull().default('uploaded'),
    error: text('error'),
    extractionModel: text('extraction_model'),
    extractionProvider: text('extraction_provider'), // nvidia-nim | mock
    confidence: real('confidence'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
  },
  (t) => [index('sd_course_idx').on(t.courseId)],
);

export const sourceFragments = sqliteTable(
  'source_fragments',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    documentId: text('document_id')
      .notNull()
      .references(() => sourceDocuments.id),
    ordinal: integer('ordinal').notNull(),
    // heading | paragraph | list | table | objective | requirement | other
    kind: text('kind').notNull(),
    text: text('text').notNull(),
    page: integer('page'),
    confidence: real('confidence'),
    /** 1 when OCR/vision flagged this fragment as an uncertain reading. */
    uncertain: integer('uncertain').notNull().default(0),
    createdAt: integer('created_at').notNull().$defaultFn(now),
  },
  (t) => [index('sf_course_idx').on(t.courseId), index('sf_doc_idx').on(t.documentId)],
);

export const knowledgePackages = sqliteTable(
  'knowledge_packages',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    version: integer('version').notNull().default(1),
    detectedTitle: text('detected_title'),
    detectedSubject: text('detected_subject'),
    detectedLevel: text('detected_level'),
    summary: text('summary'),
    /** JSON payload: units, objectives, terminology, requirements, ambiguities. */
    payload: text('payload').notNull(),
    confidence: real('confidence'),
    status: text('status').notNull().default('draft'), // draft | approved
    origin: text('origin').notNull().default('AI_GENERATED'),
    approvedAt: integer('approved_at'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
    updatedAt: integer('updated_at').notNull().$defaultFn(now),
  },
  (t) => [index('kp_course_idx').on(t.courseId)],
);

/* ------------------------------------------------------------ blueprint ---- */

/**
 * Persisted canonical blueprint snapshot. This is the single source of truth
 * for the curriculum design — generation/recovery always reads from here rather
 * than reconstructing an approximate blueprint from already-persisted entities.
 */
export const blueprints = sqliteTable(
  'blueprints',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    /** Full canonical CurriculumBlueprint as JSON, never a reconstruction. */
    payload: text('payload').notNull(),
    /** Knowledge package id this blueprint was derived from. */
    knowledgePackageId: text('knowledge_package_id'),
    /** draft | approved */
    status: text('status').notNull().default('draft'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
    updatedAt: integer('updated_at').notNull().$defaultFn(now),
  },
  (t) => [
    index('bp_course_idx').on(t.courseId),
    uniqueIndex('bp_course_uq').on(t.courseId),
  ],
);

/* ------------------------------------------------------------ curriculum ---- */

export const units = sqliteTable(
  'units',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    ordinal: integer('ordinal').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    classification: text('classification').notNull().default('REQUIRED'),
    estimatedMinutes: integer('estimated_minutes'),
    origin: text('origin').notNull().default('AI_GENERATED'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
    updatedAt: integer('updated_at').notNull().$defaultFn(now),
  },
  (t) => [index('units_course_idx').on(t.courseId)],
);

export const topics = sqliteTable(
  'topics',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    unitId: text('unit_id')
      .notNull()
      .references(() => units.id),
    ordinal: integer('ordinal').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    classification: text('classification').notNull().default('REQUIRED'),
    origin: text('origin').notNull().default('AI_GENERATED'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
    updatedAt: integer('updated_at').notNull().$defaultFn(now),
  },
  (t) => [index('topics_course_idx').on(t.courseId), index('topics_unit_idx').on(t.unitId)],
);

export const objectives = sqliteTable(
  'objectives',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    unitId: text('unit_id').references(() => units.id),
    topicId: text('topic_id').references(() => topics.id),
    ordinal: integer('ordinal').notNull(),
    code: text('code'), // e.g. U1.O2
    title: text('title').notNull(),
    /** The measurable objective statement, not a vague topic label. */
    statement: text('statement').notNull(),
    category: text('category').notNull().default('skill'),
    bloom: text('bloom'),
    difficulty: integer('difficulty').notNull().default(3),
    importance: integer('importance').notNull().default(3),
    classification: text('classification').notNull().default('REQUIRED'),
    masteryCriteria: text('mastery_criteria'), // JSON
    origin: text('origin').notNull().default('AI_GENERATED'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
    updatedAt: integer('updated_at').notNull().$defaultFn(now),
  },
  (t) => [index('obj_course_idx').on(t.courseId), index('obj_unit_idx').on(t.unitId)],
);

export const objectiveDependencies = sqliteTable(
  'objective_dependencies',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    objectiveId: text('objective_id')
      .notNull()
      .references(() => objectives.id),
    prerequisiteId: text('prerequisite_id')
      .notNull()
      .references(() => objectives.id),
    strength: text('strength').notNull().default('required'), // required | helpful
    rationale: text('rationale'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
  },
  (t) => [
    index('dep_course_idx').on(t.courseId),
    uniqueIndex('dep_edge_uq').on(t.objectiveId, t.prerequisiteId),
  ],
);

/* --------------------------------------------------------------- lessons ---- */

export const lessons = sqliteTable(
  'lessons',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    unitId: text('unit_id')
      .notNull()
      .references(() => units.id),
    topicId: text('topic_id').references(() => topics.id),
    ordinal: integer('ordinal').notNull(),
    title: text('title').notNull(),
    summary: text('summary'),
    objectiveIds: text('objective_ids').notNull().default('[]'), // JSON string[]
    domainTemplate: text('domain_template'),
    /** JSON LessonContent: sections, examples, misconceptions, visuals, checks. */
    content: text('content'),
    estimatedMinutes: integer('estimated_minutes'),
    classification: text('classification').notNull().default('REQUIRED'),
    status: text('status').notNull().default('pending'), // pending | generated | failed
    origin: text('origin').notNull().default('AI_GENERATED'),
    contentHash: text('content_hash'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
    updatedAt: integer('updated_at').notNull().$defaultFn(now),
  },
  (t) => [index('les_course_idx').on(t.courseId), index('les_unit_idx').on(t.unitId)],
);

export const activities = sqliteTable(
  'activities',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    lessonId: text('lesson_id')
      .notNull()
      .references(() => lessons.id),
    ordinal: integer('ordinal').notNull(),
    // worked_example | experiment | project | debug | source_analysis | drill
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    payload: text('payload'), // JSON
    origin: text('origin').notNull().default('AI_GENERATED'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
  },
  (t) => [index('act_lesson_idx').on(t.lessonId)],
);

/* ------------------------------------------------ practice & assessment ---- */

export const practiceSets = sqliteTable(
  'practice_sets',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    objectiveId: text('objective_id').references(() => objectives.id),
    lessonId: text('lesson_id').references(() => lessons.id),
    ordinal: integer('ordinal').notNull().default(0),
    title: text('title').notNull(),
    // recognition | guided | independent | application | transfer | challenge
    level: text('level').notNull().default('independent'),
    origin: text('origin').notNull().default('AI_GENERATED'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
  },
  (t) => [index('ps_course_idx').on(t.courseId)],
);

export const assessments = sqliteTable(
  'assessments',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    unitId: text('unit_id').references(() => units.id),
    // diagnostic | formative | unit | checkpoint | cumulative | final
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    instructions: text('instructions'),
    objectiveIds: text('objective_ids').notNull().default('[]'),
    passThreshold: real('pass_threshold').notNull().default(0.8),
    ordinal: integer('ordinal').notNull().default(0),
    origin: text('origin').notNull().default('AI_GENERATED'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
    updatedAt: integer('updated_at').notNull().$defaultFn(now),
  },
  (t) => [index('asm_course_idx').on(t.courseId)],
);

export const questions = sqliteTable(
  'questions',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    objectiveId: text('objective_id').references(() => objectives.id),
    lessonId: text('lesson_id').references(() => lessons.id),
    practiceSetId: text('practice_set_id').references(() => practiceSets.id),
    assessmentId: text('assessment_id').references(() => assessments.id),
    ordinal: integer('ordinal').notNull().default(0),
    // mcq | short_answer | numeric | proof | code | essay | matching | ordering
    kind: text('kind').notNull(),
    level: text('level').notNull().default('independent'),
    prompt: text('prompt').notNull(),
    choices: text('choices'), // JSON Choice[]
    answerKey: text('answer_key'), // JSON
    explanation: text('explanation'),
    /** JSON: the specific wrong reasoning each distractor is built to catch. */
    misconceptions: text('misconceptions'),
    expectedSkill: text('expected_skill'),
    difficulty: integer('difficulty').notNull().default(3),
    origin: text('origin').notNull().default('AI_GENERATED'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
    updatedAt: integer('updated_at').notNull().$defaultFn(now),
  },
  (t) => [
    index('q_course_idx').on(t.courseId),
    index('q_objective_idx').on(t.objectiveId),
    index('q_assessment_idx').on(t.assessmentId),
    index('q_practice_idx').on(t.practiceSetId),
  ],
);

/* --------------------------------------------------------------- mastery ---- */

export const masteryRecords = sqliteTable(
  'mastery_records',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    objectiveId: text('objective_id')
      .notNull()
      .references(() => objectives.id),
    // NOT_STARTED | INTRODUCED | PRACTICING | PROVISIONAL | MASTERED | NEEDS_REVIEW
    state: text('state').notNull().default('NOT_STARTED'),
    score: real('score').notNull().default(0),
    attemptCount: integer('attempt_count').notNull().default(0),
    correctCount: integer('correct_count').notNull().default(0),
    /** Number of qualifying assessment events, not lesson opens. */
    evidenceCount: integer('evidence_count').notNull().default(0),
    streak: integer('streak').notNull().default(0),
    lastAttemptAt: integer('last_attempt_at'),
    nextReviewAt: integer('next_review_at'),
    reviewIntervalDays: integer('review_interval_days').notNull().default(0),
    updatedAt: integer('updated_at').notNull().$defaultFn(now),
  },
  (t) => [
    index('mr_course_user_idx').on(t.courseId, t.userId),
    uniqueIndex('mr_unique').on(t.courseId, t.userId, t.objectiveId),
  ],
);

export const questionAttempts = sqliteTable(
  'question_attempts',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    questionId: text('question_id')
      .notNull()
      .references(() => questions.id),
    objectiveId: text('objective_id').references(() => objectives.id),
    response: text('response'),
    isCorrect: integer('is_correct').notNull().default(0),
    score: real('score').notNull().default(0),
    misconceptionTag: text('misconception_tag'),
    durationMs: integer('duration_ms'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
  },
  (t) => [
    index('att_course_user_idx').on(t.courseId, t.userId),
    index('att_objective_idx').on(t.objectiveId),
  ],
);

/* ------------------------------------------------------------ provenance ---- */

export const provenance = sqliteTable(
  'provenance',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    // unit | topic | objective | lesson | question | assessment
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    fragmentId: text('fragment_id').references(() => sourceFragments.id),
    documentId: text('document_id').references(() => sourceDocuments.id),
    /** DERIVED_FROM | INFERRED_FROM | ENRICHMENT_OF | NOT_SOURCED */
    relation: text('relation').notNull(),
    confidence: real('confidence'),
    note: text('note'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
  },
  (t) => [
    index('prov_course_idx').on(t.courseId),
    index('prov_entity_idx').on(t.entityType, t.entityId),
  ],
);

/* -------------------------------------------------------------------- QA ---- */

export const qaResults = sqliteTable(
  'qa_results',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    jobId: text('job_id'),
    runNumber: integer('run_number').notNull().default(1),
    checkKey: text('check_key').notNull(),
    severity: text('severity').notNull().default('warning'), // info | warning | error
    status: text('status').notNull(), // pass | fail
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    message: text('message').notNull(),
    detail: text('detail'), // JSON
    autoFixable: integer('auto_fixable').notNull().default(0),
    resolved: integer('resolved').notNull().default(0),
    resolvedAt: integer('resolved_at'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
  },
  (t) => [
    index('qar_course_idx').on(t.courseId),
    index('qar_run_idx').on(t.courseId, t.runNumber),
  ],
);

/* ------------------------------------------------------------------ jobs ---- */

export const generationJobs = sqliteTable(
  'generation_jobs',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    // ANALYZE_SOURCE | BLUEPRINT | GENERATE_COURSE | REGENERATE_LESSON | QA | REVISE
    kind: text('kind').notNull(),
    // QUEUED | ANALYZING | PLANNING | GENERATING | VALIDATING | REVISING
    // | COMPLETED | FAILED | CANCELLED
    state: text('state').notNull().default('QUEUED'),
    stage: text('stage'),
    progress: real('progress').notNull().default(0),
    message: text('message'),
    /** Idempotency key: blocks duplicate jobs from repeated form submissions. */
    requestKey: text('request_key'),
    input: text('input'), // JSON
    result: text('result'), // JSON
    error: text('error'),
    attempts: integer('attempts').notNull().default(0),
    cancelRequested: integer('cancel_requested').notNull().default(0),
    startedAt: integer('started_at'),
    finishedAt: integer('finished_at'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
    updatedAt: integer('updated_at').notNull().$defaultFn(now),
  },
  (t) => [
    index('job_course_idx').on(t.courseId),
    index('job_state_idx').on(t.state),
    uniqueIndex('job_request_key_uq').on(t.requestKey),
  ],
);

export const generationEvents = sqliteTable(
  'generation_events',
  {
    id: text('id').primaryKey(),
    jobId: text('job_id')
      .notNull()
      .references(() => generationJobs.id),
    courseId: text('course_id').notNull(),
    ordinal: integer('ordinal').notNull(),
    stage: text('stage').notNull(),
    level: text('level').notNull().default('info'),
    message: text('message').notNull(),
    model: text('model'),
    provider: text('provider'),
    latencyMs: integer('latency_ms'),
    promptTokens: integer('prompt_tokens'),
    completionTokens: integer('completion_tokens'),
    retryCount: integer('retry_count'),
    schemaFailures: integer('schema_failures'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
  },
  (t) => [index('ev_job_idx').on(t.jobId), index('ev_job_ord_idx').on(t.jobId, t.ordinal)],
);

/* ------------------------------------------------------------- user edits ---- */

export const userEdits = sqliteTable(
  'user_edits',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    field: text('field').notNull(),
    /** Retained so "reset to AI version" can restore the pre-edit value. */
    previousValue: text('previous_value'),
    newValue: text('new_value'),
    createdAt: integer('created_at').notNull().$defaultFn(now),
  },
  (t) => [
    index('ue_course_idx').on(t.courseId),
    index('ue_entity_idx').on(t.entityType, t.entityId),
  ],
);

/* ----------------------------------------------------------- AI response ---- */

/* --------------------------------------------------------------- sharing ---- */

/**
 * A share link for a course. Anyone with the token can join the course as a
 * learner. Revoking sets revokedAt; existing enrollments keep their history
 * but the link stops admitting new learners.
 */
export const courseShares = sqliteTable(
  'course_shares',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    token: text('token').notNull(),
    createdAt: integer('created_at').notNull().$defaultFn(now),
    revokedAt: integer('revoked_at'),
  },
  (t) => [
    uniqueIndex('shares_token_uq').on(t.token),
    index('shares_course_idx').on(t.courseId),
  ],
);

/** A learner who joined a course through a share link. */
export const courseEnrollments = sqliteTable(
  'course_enrollments',
  {
    id: text('id').primaryKey(),
    courseId: text('course_id')
      .notNull()
      .references(() => courses.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    shareId: text('share_id')
      .notNull()
      .references(() => courseShares.id),
    joinedAt: integer('joined_at').notNull().$defaultFn(now),
  },
  (t) => [
    uniqueIndex('enroll_course_user_uq').on(t.courseId, t.userId),
    index('enroll_course_idx').on(t.courseId),
  ],
);

/**
 * Cache of structured AI responses, keyed by a content hash of
 * (stage + model + prompt). Lets targeted regeneration skip unaffected work.
 */
export const aiCache = sqliteTable('ai_cache', {
  key: text('key').primaryKey(),
  stage: text('stage').notNull(),
  model: text('model').notNull(),
  provider: text('provider').notNull(),
  response: text('response').notNull(),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  createdAt: integer('created_at').notNull().$defaultFn(now),
});

/** Every table, in FK dependency order, for DDL emission and truncation. */
export const ALL_TABLES = [
  users,
  courses,
  courseVersions,
  sourceDocuments,
  sourceFragments,
  knowledgePackages,
  blueprints,
  units,
  topics,
  objectives,
  objectiveDependencies,
  lessons,
  activities,
  practiceSets,
  assessments,
  questions,
  masteryRecords,
  questionAttempts,
  provenance,
  qaResults,
  generationJobs,
  generationEvents,
  userEdits,
  courseShares,
  courseEnrollments,
  aiCache,
] as const;
