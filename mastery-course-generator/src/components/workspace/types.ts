/**
 * Shared client-side types for the course workspace surface.
 *
 * These mirror the JSON shapes returned by the existing course APIs. They are
 * intentionally narrow: only the fields surfaced by the UI are declared, which
 * keeps the client resilient to additive server changes.
 */

export interface Course {
  id: string;
  title: string;
  description: string | null;
  status: string;
  stage: string;
  subjectDomain: string | null;
  targetLevel: string | null;
}

export interface Unit {
  id: string;
  title: string;
  ordinal: number;
  description: string | null;
  classification: string;
  estimatedMinutes: number | null;
  origin?: string;
}

export interface Topic {
  id: string;
  unitId: string;
  ordinal: number;
  title: string;
  description: string | null;
  classification: string;
}

export interface Objective {
  id: string;
  unitId: string | null;
  topicId: string | null;
  ordinal: number;
  code: string | null;
  title: string;
  statement: string;
  category: string;
  difficulty: number;
  importance: number;
  classification: string;
  masteryCriteria: string | null;
  origin: string;
}

export interface ObjectiveDependency {
  id: string;
  objectiveId: string;
  prerequisiteId: string;
  strength: string;
  rationale: string | null;
}

export interface Lesson {
  id: string;
  unitId: string;
  topicId: string | null;
  ordinal: number;
  title: string;
  summary: string | null;
  objectiveIds: string;
  content: string | null;
  status: string;
  origin: string;
}

export interface Assessment {
  id: string;
  unitId: string | null;
  kind: string;
  title: string;
  instructions: string | null;
  objectiveIds: string;
  passThreshold: number;
  ordinal: number;
}

export interface PracticeSet {
  id: string;
  objectiveId: string | null;
  lessonId: string | null;
  ordinal: number;
  title: string;
  level: string;
}

export interface Question {
  id: string;
  objectiveId: string | null;
  lessonId: string | null;
  practiceSetId: string | null;
  assessmentId: string | null;
  ordinal: number;
  kind: string;
  prompt: string;
  choices: string | null;
  answerKey: string | null;
  explanation: string | null;
  misconceptions: string | null;
  expectedSkill: string | null;
  difficulty: number;
}

export interface WorkspaceData {
  units: Unit[];
  topics: Topic[];
  objectives: Objective[];
  dependencies: ObjectiveDependency[];
  lessons: Lesson[];
  assessments: Assessment[];
  practiceSets: PracticeSet[];
  questions: Question[];
}

export type MasteryState =
  | 'NOT_STARTED'
  | 'INTRODUCED'
  | 'PRACTICING'
  | 'PROVISIONAL'
  | 'MASTERED'
  | 'NEEDS_REVIEW';

export interface MasteryRecord {
  objectiveId: string;
  objectiveStatement: string | null;
  objectiveCode: string | null;
  state: MasteryState;
  score: number;
  attemptCount: number;
  correctCount: number;
  evidenceCount: number;
  streak: number;
  nextReviewAt: number | null;
  reviewIntervalDays: number;
}

export type RecommendationAction =
  | 'remediate'
  | 'more_practice'
  | 'advance'
  | 'challenge'
  | 'cumulative_review'
  | 'introduce';

export interface LearnerRecommendations {
  prerequisiteReview: MasteryRecord[];
  remediation: MasteryRecord[];
  morePractice: MasteryRecord[];
  advancement: MasteryRecord[];
  cumulativeReview: MasteryRecord[];
}

export interface MasteryData {
  records: MasteryRecord[];
  masteredCount: number;
  objectiveCount: number;
  upcomingReview: MasteryRecord[];
  recommendations: LearnerRecommendations;
}

export interface MasteryRecordView {
  objectiveId: string;
  objectiveStatement: string | null;
  objectiveCode: string | null;
  state: MasteryState;
  score: number;
  attemptCount: number;
  correctCount: number;
  evidenceCount: number;
  streak: number;
  nextReviewAt: number | null;
  reviewIntervalDays: number;
}

export interface AttemptResult {
  attempt: {
    isCorrect: number;
    score: number;
    misconceptionTag: string | null;
  };
  mastery: MasteryRecordView;
  recommendation: RecommendationAction;
}

export interface CourseVersion {
  id: string;
  versionNumber: number;
  label: string | null;
  status: string;
  notes: string | null;
  createdAt: number;
  publishedAt: number | null;
  isCurrent: boolean;
}

export interface CurriculumSnapshot {
  units: Record<string, unknown>[];
  topics: Record<string, unknown>[];
  objectives: Record<string, unknown>[];
  lessons: Record<string, unknown>[];
  assessments: Record<string, unknown>[];
  practiceSets: Record<string, unknown>[];
  questions: Record<string, unknown>[];
}

export interface LessonContent {
  objectives?: string[];
  sections?: LessonSection[];
  misconceptions?: Misconception[];
  visuals?: VisualSpec[];
  masteryCheck?: { prompt: string; criteria: string } | null;
  summary?: string;
  estimatedMinutes?: number;
}

export interface LessonSection {
  id?: string;
  type?: string;
  title?: string;
  content?: string;
  visual?: VisualSpec | null;
}

export interface Misconception {
  misconception?: string;
  correction?: string;
  distractorId?: string;
}

export interface VisualSpec {
  type?: string;
  purpose?: string;
  subject?: string;
  labels?: string[];
  caption?: string;
  objectiveId?: string;
}

export interface Choice {
  id?: string;
  text?: string;
  index?: number;
  isCorrect?: boolean;
}

export interface AnswerKey {
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