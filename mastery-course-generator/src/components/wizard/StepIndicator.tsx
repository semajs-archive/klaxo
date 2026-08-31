'use client';

import { useId, useState } from 'react';
import { clsx } from 'clsx';
import { cn } from '@/lib/cn';

export interface Step {
  id: string;
  label: string;
}

export type StepStatus = 'completed' | 'current' | 'pending' | 'locked' | 'warning' | 'failed';

export interface StepIndicatorProps {
  steps: Step[];
  currentStep: string;
  completedSteps: string[];
  /** Steps that show a warning state (e.g. QA reported remaining issues). */
  warningSteps?: string[];
  /** Steps that show a failed state (e.g. a job failed). */
  errorSteps?: string[];
}

function statusFor(
  stepId: string,
  currentStep: string,
  completedSteps: string[],
  warningSteps: string[],
  errorSteps: string[],
  index: number,
  currentIndex: number,
): StepStatus {
  if (errorSteps.includes(stepId)) return 'failed';
  if (warningSteps.includes(stepId)) return 'warning';
  if (completedSteps.includes(stepId)) return 'completed';
  if (stepId === currentStep) return 'current';
  // Anything after the current step that isn't completed is locked.
  if (index > currentIndex) return 'locked';
  return 'pending';
}

const STATUS_WORD: Record<StepStatus, string> = {
  completed: 'Done',
  current: 'You are here',
  pending: 'Not started',
  locked: 'Locked',
  warning: 'Needs a look',
  failed: 'Failed',
};

/** The circle's fill for a given status — shared by both layouts. */
function markClasses(status: StepStatus) {
  return clsx(
    status === 'completed' && 'border-transparent bg-primary text-primary-foreground',
    status === 'current' &&
      'border-primary-border bg-primary-soft text-primary-soft-foreground shadow-sm',
    status === 'warning' && 'border-transparent bg-warning text-warning-foreground',
    status === 'failed' && 'border-transparent bg-error text-error-foreground',
    status === 'locked' && 'border-border bg-muted text-muted-foreground opacity-60',
    status === 'pending' && 'border-border bg-muted text-muted-foreground',
  );
}

/** The glyph inside the circle: tick, cross, warning, padlock, or the number. */
function StepMark({ status, index }: { status: StepStatus; index: number }) {
  if (status === 'completed') {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  if (status === 'failed') {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
  }
  if (status === 'warning') {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      </svg>
    );
  }
  if (status === 'locked') {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    );
  }
  return <>{index + 1}</>;
}

export function StepIndicator({
  steps,
  currentStep,
  completedSteps,
  warningSteps = [],
  errorSteps = [],
}: StepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);
  const [open, setOpen] = useState(false);
  const listId = useId();

  const currentLabel = steps[currentIndex]?.label ?? steps[0]?.label ?? '';
  const doneCount = steps.filter((s) => completedSteps.includes(s.id)).length;
  const percent = Math.max(8, Math.round(((doneCount + 0.5) / steps.length) * 100));

  const statuses: Record<string, StepStatus> = {};
  steps.forEach((step, index) => {
    statuses[step.id] = statusFor(
      step.id,
      currentStep,
      completedSteps,
      warningSteps,
      errorSteps,
      index,
      currentIndex,
    );
  });

  return (
    <nav aria-label="Progress" className="mb-8">
      {/*
        Phone: the seven-across bar does not fit 390px, so it collapses to
        "Step 2 of 7", the step's name and a progress bar. Tapping opens the
        whole list, locked steps included, so nobody loses the map.
      */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={listId}
          className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-left shadow-sm transition-colors ease-standard active:bg-secondary"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Step {currentIndex + 1} of {steps.length}
            </span>
            <span className="block truncate font-display text-sm font-bold">{currentLabel}</span>
          </span>
          <span className="shrink-0 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {open ? 'Hide' : 'All steps'}
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform ease-standard', open && 'rotate-180')}
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        <div
          className="mt-2 h-2 overflow-hidden rounded-full border border-border bg-muted"
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-label={`Step ${currentIndex + 1} of ${steps.length}`}
        >
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        </div>

        {open && (
          <ol id={listId} className="mt-3 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            {steps.map((step, index) => {
              const status = statuses[step.id] ?? 'pending';
              return (
                <li
                  key={step.id}
                  aria-current={status === 'current' ? 'step' : undefined}
                  className={cn(
                    'flex min-h-14 items-center gap-3 px-4 py-2.5',
                    index > 0 && 'border-t border-hairline',
                    status === 'current' && 'bg-primary-soft/40',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-display text-sm font-bold',
                      markClasses(status),
                    )}
                  >
                    <StepMark status={status} index={index} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block truncate font-display text-sm font-semibold',
                        status === 'locked' ? 'text-muted-foreground' : 'text-foreground',
                      )}
                    >
                      {step.label}
                    </span>
                    <span
                      className={cn(
                        'block font-sans text-[11px] font-semibold uppercase tracking-[0.12em]',
                        status === 'warning'
                          ? 'text-warning-subtle-foreground'
                          : status === 'failed'
                          ? 'text-error'
                          : status === 'current'
                          ? 'text-primary'
                          : 'text-muted-foreground',
                      )}
                    >
                      {STATUS_WORD[status]}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <ol className="hidden items-start sm:flex">
        {steps.map((step, index) => {
          const status = statuses[step.id] ?? 'pending';
          const isLast = index === steps.length - 1;
          const isCompleted = status === 'completed';
          const isCurrent = status === 'current';
          const isWarning = status === 'warning';
          const isFailed = status === 'failed';

          return (
            <li key={step.id} className={clsx('flex items-start', !isLast && 'flex-1')}>
              <div className="flex flex-col items-center">
                <div
                  className={clsx(
                    'flex h-10 w-10 items-center justify-center rounded-full border font-display text-sm font-bold transition-colors',
                    markClasses(status),
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <StepMark status={status} index={index} />
                </div>
                <span
                  className={clsx(
                    'mt-2 hidden text-center font-sans text-[10px] font-semibold uppercase tracking-[0.1em] sm:block',
                    isCurrent
                      ? 'font-medium text-foreground'
                      : isWarning
                      ? 'text-warning-subtle-foreground'
                      : isFailed
                      ? 'text-error'
                      : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={clsx(
                    'mx-1.5 mt-5 h-[2px] flex-1 rounded-full',
                    isCompleted ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
