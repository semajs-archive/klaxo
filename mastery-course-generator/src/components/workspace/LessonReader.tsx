'use client';

/**
 * Lesson reader: renders a lesson's stored JSON `LessonContent` (objectives,
 * sections, misconceptions, summary, mastery check) as a readable document.
 * Each section's Markdown is rendered through MarkdownViewer.
 */
import { useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import MarkdownViewer from './MarkdownViewer';
import { parseLessonContent } from './helpers';
import type { Lesson, LessonContent } from './types';

export interface LessonReaderProps {
  lesson: Lesson;
  /** Map of objective id → statement for the "objectives" header. */
  objectiveStatements?: Record<string, string>;
}

const SECTION_TYPE_LABELS: Record<string, string> = {
  objective: 'Objective',
  prerequisite_review: 'Prerequisite Review',
  motivation: 'Motivation',
  intuition: 'Intuition',
  explanation: 'Explanation',
  definition: 'Definition',
  example: 'Example',
  worked_example: 'Worked Example',
  visual: 'Visual',
  misconception: 'Common Misconception',
  guided_practice: 'Guided Practice',
  independent_practice: 'Independent Practice',
  challenge: 'Challenge',
  retrieval: 'Retrieval',
  summary: 'Summary',
  mastery_check: 'Mastery Check',
};

function sectionTitle(sectionType: string | undefined, fallback: string | undefined): string {
  if (fallback) return fallback;
  if (sectionType && SECTION_TYPE_LABELS[sectionType]) return SECTION_TYPE_LABELS[sectionType];
  return 'Section';
}

export default function LessonReader({ lesson, objectiveStatements }: LessonReaderProps) {
  const content: LessonContent = useMemo(() => parseLessonContent(lesson.content), [lesson.content]);

  const hasContent = (content.sections?.length ?? 0) > 0;
  const misconceptions = content.misconceptions ?? [];

  return (
    <article className="space-y-5">
      {lesson.summary && (
        <p className="rounded-md bg-muted/60 p-3 font-serif text-[15px] leading-7 text-foreground-soft">
          {lesson.summary}
        </p>
      )}

      {(content.objectives?.length ?? 0) > 0 && (
        <div className="rounded-md border p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Objectives
          </h4>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {content.objectives!.map((objId, i) => (
              <li key={objId + i}>
                {objectiveStatements?.[objId] ?? objId}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasContent ? (
        <div className="space-y-4">
          {content.sections!.map((section, idx) => (
            <section key={section.id ?? idx} className="rounded-md border p-4">
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {sectionTitle(section.type, section.title)}
                </h3>
                {section.type && (
                  <Badge variant="outline" className="text-[10px]">
                    {SECTION_TYPE_LABELS[section.type] ?? section.type}
                  </Badge>
                )}
              </div>

              {section.content && (
                <MarkdownViewer
                  content={section.content}
                  className="font-serif text-[15px] leading-7"
                />
              )}

              {section.visual && (
                <div className="mt-3 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                  {section.visual.caption && (
                    <p className="mb-1 font-medium text-foreground">{section.visual.caption}</p>
                  )}
                  {section.visual.type && (
                    <p>
                      <span className="font-medium">Visual:</span>{' '}
                      {section.visual.purpose ?? section.visual.subject ?? section.visual.type}
                    </p>
                  )}
                  {(section.visual.labels?.length ?? 0) > 0 && (
                    <p className="mt-1">Labels: {section.visual.labels!.join(', ')}</p>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed p-6 text-center font-serif text-[15px] text-muted-foreground">
          This lesson has no rendered content yet.
        </div>
      )}

      {content.masteryCheck && (
        <div className="rounded-md border border-info/30 bg-info-subtle p-3">
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-info-subtle-foreground">
            Mastery Check
          </h4>
          <p className="text-sm">{content.masteryCheck.prompt}</p>
          {content.masteryCheck.criteria && (
            <p className="mt-1 text-xs text-muted-foreground">
              Criteria: {content.masteryCheck.criteria}
            </p>
          )}
        </div>
      )}

      {misconceptions.length > 0 && (
        <div className="rounded-md border border-warning/30 bg-warning-subtle p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-warning-subtle-foreground">
            Watch out for misconceptions
          </h4>
          <ul className="space-y-2 text-sm">
            {misconceptions.map((m, i) => (
              <li key={i}>
                {m.misconception && (
                  <span className="font-medium">{m.misconception}</span>
                )}
                {m.misconception && m.correction && ' — '}
                {m.correction && <span>{m.correction}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {content.summary && (
        <div className="rounded-md border p-4">
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Summary
          </h4>
          <MarkdownViewer content={content.summary} className="font-serif text-[15px] leading-7" />
        </div>
      )}
    </article>
  );
}