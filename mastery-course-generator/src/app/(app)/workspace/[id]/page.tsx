'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/cn';
import QuestionCard from '@/components/workspace/QuestionCard';
import LessonReader from '@/components/workspace/LessonReader';
import SharePanel from '@/components/workspace/SharePanel';
import type {
  Assessment,
  Course,
  CourseVersion,
  CurriculumSnapshot,
  Lesson,
  MasteryData,
  Objective,
  PracticeSet,
  Question,
  Unit,
  WorkspaceData,
} from '@/components/workspace/types';
import {
  formatDate,
  masteryLabel,
  masteryVariant,
  recommendationLabel,
  relativeDays,
  unitDisplayTitle,
} from '@/components/workspace/helpers';

type TabId =
  | 'overview'
  | 'curriculum'
  | 'lessons'
  | 'practice'
  | 'assessments'
  | 'mastery'
  | 'versions';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'curriculum', label: 'Curriculum' },
  { id: 'lessons', label: 'Lessons' },
  { id: 'practice', label: 'Practice' },
  { id: 'assessments', label: 'Assessments' },
  { id: 'mastery', label: 'Mastery' },
  { id: 'versions', label: 'Versions' },
];

const EMPTY_WORKSPACE: WorkspaceData = {
  units: [],
  topics: [],
  objectives: [],
  dependencies: [],
  lessons: [],
  assessments: [],
  practiceSets: [],
  questions: [],
};

export default function WorkspacePage() {
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceData>(EMPTY_WORKSPACE);
  const [mastery, setMastery] = useState<MasteryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [access, setAccess] = useState<'owner' | 'learner'>('owner');

  const load = useCallback(async () => {
    try {
      const [courseRes, workspaceRes, masteryRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/courses/${courseId}/workspace`),
        fetch(`/api/courses/${courseId}/mastery`),
      ]);

      if (!courseRes.ok) {
        const e = await courseRes.json().catch(() => null);
        throw new Error(e?.error ?? 'Failed to load course');
      }
      const courseData = await courseRes.json();
      setCourse(courseData.course as Course);
      setAccess(courseData.access === 'learner' ? 'learner' : 'owner');

      if (workspaceRes.ok) {
        const ws = await workspaceRes.json();
        setWorkspace({
          units: (ws.units ?? []) as Unit[],
          topics: (ws.topics ?? []) as WorkspaceData['topics'],
          objectives: (ws.objectives ?? []) as Objective[],
          dependencies: (ws.dependencies ?? []) as WorkspaceData['dependencies'],
          lessons: (ws.lessons ?? []) as Lesson[],
          assessments: (ws.assessments ?? []) as Assessment[],
          practiceSets: (ws.practiceSets ?? []) as PracticeSet[],
          questions: (ws.questions ?? []) as Question[],
        });
      }

      if (masteryRes.ok) {
        const m = await masteryRes.json();
        setMastery(m as MasteryData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    let mounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [load]);

  const objectiveById = useMemo(() => {
    const map = new Map<string, Objective>();
    for (const o of workspace.objectives) map.set(o.id, o);
    return map;
  }, [workspace.objectives]);

  const unitById = useMemo(() => {
    const map = new Map<string, Unit>();
    for (const u of workspace.units) map.set(u.id, u);
    return map;
  }, [workspace.units]);

  const objectiveStatements = useMemo(() => {
    const map: Record<string, string> = {};
    for (const o of workspace.objectives) map[o.id] = o.statement;
    return map;
  }, [workspace.objectives]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <WorkspaceSkeleton />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Card className="py-12 text-center">
          <CardContent>
            <h1 className="text-xl font-semibold">Unable to load workspace</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {error ?? 'Course not found'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  void load();
                }}
              >
                Retry
              </Button>
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        {access === 'owner' && (
          <Link
            href="/dashboard"
            className="mb-3 inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
          >
            ← Back to Dashboard
          </Link>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          {access === 'owner' && (
            <>
              <Badge variant="outline" dot>
                {course.status}
              </Badge>
              <Badge variant="secondary">{course.stage}</Badge>
            </>
          )}
          {access === 'owner' && (
            <div className="ml-auto">
              <SharePanel courseId={courseId} />
            </div>
          )}
        </div>
        <p className="mt-1 text-muted-foreground">
          {course.description || 'No description'}
        </p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.filter((tab) => access === 'owner' || tab.id !== 'versions').map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'whitespace-nowrap rounded-full px-4 py-2 font-display text-sm font-bold transition-all',
              activeTab === tab.id
                ? 'border-[1.5px] border-ink bg-brand-400 text-foreground shadow-pop-sm'
                : 'border-[1.5px] border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'overview' && (
          <OverviewTab course={course} workspace={workspace} mastery={mastery} />
        )}
        {activeTab === 'curriculum' && (
          <CurriculumTab workspace={workspace} objectiveById={objectiveById} />
        )}
        {activeTab === 'lessons' && (
          <LessonsTab
            workspace={workspace}
            unitById={unitById}
            objectiveStatements={objectiveStatements}
          />
        )}
        {activeTab === 'practice' && (
          <PracticeTab workspace={workspace} courseId={courseId} objectiveStatements={objectiveStatements} />
        )}
        {activeTab === 'assessments' && (
          <AssessmentsTab workspace={workspace} courseId={courseId} objectiveStatements={objectiveStatements} />
        )}
        {activeTab === 'mastery' && (
          <MasteryTab mastery={mastery} />
        )}
        {activeTab === 'versions' && (
          <VersionsTab courseId={courseId} onWorkspaceChanged={() => void load()} />
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Overview ---- */

function OverviewTab({
  course,
  workspace,
  mastery,
}: {
  course: Course;
  workspace: WorkspaceData;
  mastery: MasteryData | null;
}) {
  const counts = [
    { label: 'Units', value: workspace.units.length },
    { label: 'Objectives', value: workspace.objectives.length },
    { label: 'Lessons', value: workspace.lessons.length },
    { label: 'Assessments', value: workspace.assessments.length },
    { label: 'Questions', value: workspace.questions.length },
  ];

  const mastered = mastery?.masteredCount ?? 0;
  const objectiveCount = mastery?.objectiveCount ?? workspace.objectives.length;
  const progressPct = objectiveCount > 0 ? Math.round((mastered / objectiveCount) * 100) : 0;

  const generatedLessons = workspace.lessons.filter((l) => l.status === 'generated').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {counts.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4 sm:py-5 sm:pl-6">
              <div className="font-display text-3xl font-extrabold sm:text-4xl">{c.value}</div>
              <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px]">{c.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <CardDescription>Mastery readiness across all objectives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>{mastered} mastered</span>
              <span className="text-muted-foreground">
                of {objectiveCount} objectives ({progressPct}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>Course & generation summary</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <Row label="Subject" value={course.subjectDomain ?? '—'} />
              <Row label="Target level" value={course.targetLevel ?? '—'} />
              <Row label="Status" value={course.status} />
              <Row label="Stage" value={course.stage} />
              <Row
                label="Generated lessons"
                value={`${generatedLessons} / ${workspace.lessons.length}`}
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>QA & readiness</CardTitle>
          <CardDescription>Mastery signal and follow-up items</CardDescription>
        </CardHeader>
        <CardContent>
          {mastery && mastery.upcomingReview.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {mastery.upcomingReview.slice(0, 5).map((r) => (
                <li key={r.objectiveId} className="flex items-center justify-between gap-3">
                  <span className="truncate">
                    {r.objectiveStatement ?? r.objectiveId}
                  </span>
                  <Badge variant={masteryVariant(r.state)} dot>
                    {masteryLabel(r.state)}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No objectives are due for review. Mastered objectives appear here when their
              spaced-review window approaches.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium capitalize">{value}</dd>
    </div>
  );
}

/* ------------------------------------------------------------- Curriculum ---- */

function CurriculumTab({
  workspace,
  objectiveById,
}: {
  workspace: WorkspaceData;
  objectiveById: Map<string, Objective>;
}) {
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  const objectivesByUnit = useMemo(() => {
    const map = new Map<string, Objective[]>();
    for (const o of workspace.objectives) {
      const key = o.unitId ?? '__none__';
      const list = map.get(key) ?? [];
      list.push(o);
      map.set(key, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.ordinal - b.ordinal);
    return map;
  }, [workspace.objectives]);

  // Dependency edges (prerequisiteId -> objectiveId) for prerequisite hints.
  const prerequisitesByObjective = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const d of workspace.dependencies) {
      const list = map.get(d.objectiveId) ?? [];
      list.push(d.prerequisiteId);
      map.set(d.objectiveId, list);
    }
    return map;
  }, [workspace.dependencies]);

  const toggleUnit = useCallback((id: string) => {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (workspace.units.length === 0) {
    return (
      <EmptyState
        title="No curriculum yet"
        message="Complete the wizard to generate units and objectives for this course."
      />
    );
  }

  return (
    <div className="space-y-4">
      {workspace.units.map((unit) => {
        const objectives = objectivesByUnit.get(unit.id) ?? [];
        const expanded = expandedUnits.has(unit.id);
        return (
          <Card key={unit.id}>
            <button
              type="button"
              onClick={() => toggleUnit(unit.id)}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-6 py-4 text-left hover:bg-accent/40"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Unit {unit.ordinal + 1}</span>
                  <h3 className="text-lg font-semibold">{unitDisplayTitle(unit.title)}</h3>
                  <Badge variant="outline">{unit.classification}</Badge>
                </div>
                {unit.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{unit.description}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {objectives.length} objectives
              </span>
            </button>

            {expanded && (
              <CardContent className="border-t pt-4">
                {objectives.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No objectives assigned to this unit.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {objectives.map((o) => {
                      const prereqs = prerequisitesByObjective.get(o.id) ?? [];
                      return (
                        <li key={o.id} className="rounded-md border p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {o.code && (
                              <Badge variant="secondary" className="font-mono">
                                {o.code}
                              </Badge>
                            )}
                            <span className="font-medium">{o.title}</span>
                            <DifficultyDots value={o.difficulty} />
                            <ImportanceDots value={o.importance} />
                            <Badge variant="outline">{o.category}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{o.statement}</p>
                          {prereqs.length > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Prerequisites:{' '}
                              {prereqs
                                .map((pid) => objectiveById.get(pid)?.title ?? pid)
                                .join(', ')}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function DifficultyDots({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`Difficulty: ${value}/5`}>
      <span className="mr-0.5 text-[10px] text-muted-foreground">Diff</span>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            i <= value ? 'bg-primary' : 'bg-muted',
          )}
        />
      ))}
    </span>
  );
}

function ImportanceDots({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`Importance: ${value}/5`}>
      <span className="mr-0.5 text-[10px] text-muted-foreground">Imp</span>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            i <= value ? 'bg-warning' : 'bg-muted',
          )}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ Lessons ---- */

function LessonsTab({
  workspace,
  unitById,
  objectiveStatements,
}: {
  workspace: WorkspaceData;
  unitById: Map<string, Unit>;
  objectiveStatements: Record<string, string>;
}) {
  const [query, setQuery] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  const lessonsByUnit = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    for (const l of workspace.lessons) {
      const list = map.get(l.unitId) ?? [];
      list.push(l);
      map.set(l.unitId, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.ordinal - b.ordinal);
    return map;
  }, [workspace.lessons]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return workspace.lessons;
    return workspace.lessons.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        (l.summary ?? '').toLowerCase().includes(q),
    );
  }, [query, workspace.lessons]);

  const selectedLesson = selectedLessonId
    ? workspace.lessons.find((l) => l.id === selectedLessonId) ?? null
    : null;

  if (workspace.lessons.length === 0) {
    return <EmptyState title="No lessons yet" message="Generate lessons in the wizard first." />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-3">
        <Input
          placeholder="Search lessons…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lessons match your search.</p>
          ) : (
            [...lessonsByUnit.keys()].map((unitId) => {
              const unitLessons = lessonsByUnit.get(unitId) ?? [];
              const visible = unitLessons.filter((l) => filtered.some((f) => f.id === l.id));
              if (visible.length === 0) return null;
              const unit = unitById.get(unitId);
              return (
                <div key={unitId}>
                  <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {unit ? `Unit ${unit.ordinal + 1}: ${unitDisplayTitle(unit.title)}` : 'General'}
                  </h4>
                  <ul className="space-y-1">
                    {visible.map((lesson) => (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedLessonId(lesson.id)}
                          className={cn(
                            'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                            selectedLessonId === lesson.id
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent',
                          )}
                        >
                          <span className="line-clamp-1">{lesson.title}</span>
                          <span
                            className={cn(
                              'text-xs',
                              selectedLessonId === lesson.id
                                ? 'text-primary-foreground/80'
                                : 'text-muted-foreground',
                            )}
                          >
                            {lesson.status}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div>
        {selectedLesson ? (
          <Card>
            <CardHeader>
              <CardTitle>{selectedLesson.title}</CardTitle>
              <CardDescription>
                <Badge variant="outline">{selectedLesson.status}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LessonReader
                lesson={selectedLesson}
                objectiveStatements={objectiveStatements}
              />
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="Select a lesson"
            message="Choose a lesson from the list to read its content."
          />
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- Practice ---- */

function PracticeTab({
  workspace,
  courseId,
  objectiveStatements,
}: {
  workspace: WorkspaceData;
  courseId: string;
  objectiveStatements: Record<string, string>;
}) {
  // Practice questions = questions tied to a practice set, or questions NOT tied to any assessment.
  const practiceQuestions = useMemo(
    () =>
      workspace.questions.filter(
        (q) => q.practiceSetId != null || q.assessmentId == null,
      ),
    [workspace.questions],
  );

  return (
    <QuestionList
      questions={practiceQuestions}
      courseId={courseId}
      objectiveStatements={objectiveStatements}
      emptyTitle="No practice questions yet"
      emptyMessage="Practice questions appear here after the course is generated."
    />
  );
}

/* -------------------------------------------------------------- Assessments ---- */

function AssessmentsTab({
  workspace,
  courseId,
  objectiveStatements,
}: {
  workspace: WorkspaceData;
  courseId: string;
  objectiveStatements: Record<string, string>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (workspace.assessments.length === 0) {
    return (
      <EmptyState
        title="No assessments yet"
        message="Assessments appear here after the course is generated."
      />
    );
  }

  const selected = selectedId
    ? workspace.assessments.find((a) => a.id === selectedId) ?? null
    : workspace.assessments[0] ?? null;

  const questions = selected
    ? workspace.questions.filter((q) => q.assessmentId === selected.id)
    : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Assessments
        </h4>
        <ul className="space-y-2">
          {workspace.assessments.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setSelectedId(a.id)}
                className={cn(
                  'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors',
                  selected?.id === a.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40',
                )}
              >
                <div className="font-medium">{a.title}</div>
                <div className="text-xs text-muted-foreground">
                  {a.kind} · {a.passThreshold != null ? `${Math.round(a.passThreshold * 100)}% pass` : ''}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        {selected ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{selected.title}</CardTitle>
                {selected.instructions && (
                  <CardDescription>{selected.instructions}</CardDescription>
                )}
              </CardHeader>
            </Card>
            {questions.length === 0 ? (
              <EmptyState
                title="No questions"
                message="This assessment has no questions yet."
              />
            ) : (
              <QuestionList
                questions={questions}
                courseId={courseId}
                objectiveStatements={objectiveStatements}
              />
            )}
          </div>
        ) : (
          <EmptyState title="Select an assessment" message="Choose an assessment to view its questions." />
        )}
      </div>
    </div>
  );
}

/** Shared by Practice and Assessments: renders a list of interactive questions. */
function QuestionList({
  questions,
  courseId,
  objectiveStatements,
  emptyTitle,
  emptyMessage,
}: {
  questions: Question[];
  courseId: string;
  objectiveStatements: Record<string, string>;
  emptyTitle?: string;
  emptyMessage?: string;
}) {
  if (questions.length === 0) {
    return <EmptyState title={emptyTitle ?? 'No questions'} message={emptyMessage ?? ''} />;
  }
  const sorted = [...questions].sort((a, b) => a.ordinal - b.ordinal);
  return (
    <div className="space-y-4">
      {sorted.map((q) => (
        <QuestionCard
          key={q.id}
          question={q}
          courseId={courseId}
          objectiveStatement={q.objectiveId ? objectiveStatements[q.objectiveId] ?? null : null}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Mastery ---- */

function MasteryTab({
  mastery,
}: {
  mastery: MasteryData | null;
}) {
  if (!mastery || mastery.records.length === 0) {
    return (
      <EmptyState
        title="No mastery activity yet"
        message="Answer practice or assessment questions to start tracking mastery."
      />
    );
  }

  const recs = mastery.recommendations;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Mastered" value={`${mastery.masteredCount}`} />
        <StatCard label="Objectives" value={`${mastery.objectiveCount}`} />
        <StatCard
          label="Upcoming review"
          value={`${mastery.upcomingReview.length}`}
        />
      </div>

      {/* Objective mastery table */}
      <Card>
        <CardHeader>
          <CardTitle>Objective mastery</CardTitle>
          <CardDescription>Per-objective evidence and schedule</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3">Objective</th>
                <th className="py-2 pr-3">State</th>
                <th className="py-2 pr-3">Score</th>
                <th className="py-2 pr-3">Evidence</th>
                <th className="py-2 pr-3">Streak</th>
                <th className="py-2">Review</th>
              </tr>
            </thead>
            <tbody>
              {mastery.records.map((r) => (
                <tr key={r.objectiveId} className="border-b last:border-0">
                  <td className="max-w-[220px] truncate py-2 pr-3">
                    {r.objectiveStatement ?? r.objectiveId}
                  </td>
                  <td className="py-2 pr-3">
                    <Badge variant={masteryVariant(r.state)} dot>
                      {masteryLabel(r.state)}
                    </Badge>
                  </td>
                  <td className="py-2 pr-3">{Math.round(r.score * 100)}%</td>
                  <td className="py-2 pr-3">{r.evidenceCount}</td>
                  <td className="py-2 pr-3">{r.streak}</td>
                  <td className="py-2 text-muted-foreground">
                    {relativeDays(r.nextReviewAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RecommendationCard
          title="Remediation"
          message="Objectives flagged for review due to incorrect answers."
          records={recs.remediation}
          empty="No remediation needed right now."
          action="remediate"
        />
        <RecommendationCard
          title="More practice"
          message="Objectives currently being introduced or practiced."
          records={recs.morePractice}
          empty="No objectives currently in practice."
          action="more_practice"
        />
        <RecommendationCard
          title="Advancement"
          message="Provisional objectives ready to advance."
          records={recs.advancement}
          empty="No objectives ready to advance."
          action="advance"
        />
        <RecommendationCard
          title="Cumulative review"
          message="Mastered objectives approaching their review window."
          records={recs.cumulativeReview}
          empty="No cumulative review due."
          action="cumulative_review"
        />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function RecommendationCard({
  title,
  message,
  records,
  empty,
  action,
}: {
  title: string;
  message: string;
  records: { objectiveId: string; objectiveStatement?: string | null }[];
  empty: string;
  action: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {title}
          <Badge variant="outline">{records.length}</Badge>
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {records.slice(0, 6).map((r) => (
              <li key={r.objectiveId}>
                {r.objectiveStatement ?? r.objectiveId}
              </li>
            ))}
          </ul>
        )}
        {action && (
          <p className="mt-2 text-xs text-muted-foreground">
            {recommendationLabel(action as never)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ----------------------------------------------------------------- Versions ---- */

function VersionsTab({
  courseId,
  onWorkspaceChanged,
}: {
  courseId: string;
  onWorkspaceChanged: () => void;
}) {
  const [versions, setVersions] = useState<CourseVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<CurriculumSnapshot | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');

  const loadVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/versions`);
      if (!res.ok) {
        const e = await res.json().catch(() => null);
        throw new Error(e?.error ?? 'Failed to load versions');
      }
      const data = await res.json();
      setVersions((data.versions ?? []) as CourseVersion[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load versions');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    let mounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadVersions().finally(() => {
      if (mounted) setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [loadVersions]);

  const selectVersion = useCallback(async (id: string) => {
    setSelectedId(id);
    setSnapshot(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/versions/${id}`);
      if (!res.ok) {
        const e = await res.json().catch(() => null);
        throw new Error(e?.error ?? 'Failed to load snapshot');
      }
      const data = await res.json();
      setSnapshot((data.snapshot ?? null) as CurriculumSnapshot | null);
    } catch {
      setSnapshot(null);
    }
  }, [courseId]);

  const createVersion = useCallback(async () => {
    if (!label.trim() && !notes.trim()) return;
    setBusyId(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: label.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => null);
        throw new Error(e?.error ?? 'Failed to create version');
      }
      setShowCreate(false);
      setLabel('');
      setNotes('');
      await loadVersions();
      onWorkspaceChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create version');
    }
  }, [courseId, label, notes, loadVersions, onWorkspaceChanged]);

  const runAction = useCallback(
    async (id: string, action: 'publish' | 'restore') => {
      setBusyId(id);
      setError(null);
      try {
        const res = await fetch(`/api/courses/${courseId}/versions/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => null);
          throw new Error(e?.error ?? `Failed to ${action}`);
        }
        await loadVersions();
        if (action === 'restore') onWorkspaceChanged();
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to ${action}`);
      } finally {
        setBusyId(null);
      }
    },
    [courseId, loadVersions, onWorkspaceChanged],
  );

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Course versions</h2>
        <Button onClick={() => setShowCreate((v) => !v)} variant={showCreate ? 'outline' : 'primary'}>
          {showCreate ? 'Cancel' : 'Create version'}
        </Button>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>New version</CardTitle>
            <CardDescription>Snapshot the current curriculum as a new draft.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              label="Label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. v1 — post-QA"
            />
            <Textarea
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what changed"
            />
            <Button onClick={() => void createVersion()} disabled={!label.trim() && !notes.trim()}>
              Create
            </Button>
          </CardContent>
        </Card>
      )}

      {versions.length === 0 ? (
        <EmptyState
          title="No versions yet"
          message="Create a version to snapshot the current curriculum."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {versions.map((v) => (
              <VersionRow
                key={v.id}
                version={v}
                selected={selectedId === v.id}
                busy={busyId === v.id}
                onSelect={() => void selectVersion(v.id)}
                onPublish={() => void runAction(v.id, 'publish')}
                onRestore={() => void runAction(v.id, 'restore')}
              />
            ))}
          </div>

          <div>
            {snapshot ? (
              <SnapshotView snapshot={snapshot} />
            ) : (
              <EmptyState
                title="Select a version"
                message="Choose a version to see its curriculum counts."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function VersionRow({
  version,
  selected,
  busy,
  onSelect,
  onPublish,
  onRestore,
}: {
  version: CourseVersion;
  selected: boolean;
  busy: boolean;
  onSelect: () => void;
  onPublish: () => void;
  onRestore: () => void;
}) {
  return (
    <Card className={cn(selected && 'border-primary')}>
      <CardContent className="space-y-3 py-4">
        <button type="button" onClick={onSelect} className="w-full text-left">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">
              v{version.versionNumber}
              {version.label ? ` — ${version.label}` : ''}
            </span>
            <Badge variant={version.status === 'published' ? 'success' : 'secondary'}>
              {version.status}
            </Badge>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {version.isCurrent && (
              <span className="mr-2 font-medium text-primary">Current</span>
            )}
            Created {formatDate(version.createdAt)}
          </div>
          {version.publishedAt && (
            <div className="text-xs text-muted-foreground">
              Published {formatDate(version.publishedAt)}
            </div>
          )}
          {version.notes && (
            <p className="mt-2 text-sm text-muted-foreground">{version.notes}</p>
          )}
        </button>

        <div className="flex gap-2">
          {version.status !== 'published' && (
            <Button size="sm" variant="outline" onClick={onPublish} loading={busy}>
              Publish
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onRestore} loading={busy}>
            Restore
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SnapshotView({ snapshot }: { snapshot: CurriculumSnapshot }) {
  const counts = [
    { label: 'Units', value: snapshot.units?.length ?? 0 },
    { label: 'Topics', value: snapshot.topics?.length ?? 0 },
    { label: 'Objectives', value: snapshot.objectives?.length ?? 0 },
    { label: 'Lessons', value: snapshot.lessons?.length ?? 0 },
    { label: 'Assessments', value: snapshot.assessments?.length ?? 0 },
    { label: 'Practice sets', value: snapshot.practiceSets?.length ?? 0 },
    { label: 'Questions', value: snapshot.questions?.length ?? 0 },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Snapshot</CardTitle>
        <CardDescription>Curriculum entity counts</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="divide-y text-sm">
          {counts.map((c) => (
            <div key={c.label} className="flex justify-between py-2">
              <dt className="text-muted-foreground">{c.label}</dt>
              <dd className="font-medium">{c.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------- Shared ---- */

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <Card className="py-12 text-center">
      <CardContent>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-4 w-96" />
      <div className="flex gap-4 border-b pb-3">
        {TABS.map((t) => (
          <Skeleton key={t.id} className="h-6 w-20" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}