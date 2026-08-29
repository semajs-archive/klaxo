'use client';

import { clsx } from 'clsx';

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

export function StepIndicator({
  steps,
  currentStep,
  completedSteps,
  warningSteps = [],
  errorSteps = [],
}: StepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  const currentLabel = steps[currentIndex]?.label ?? steps[0]?.label ?? '';
  const doneCount = steps.filter((s) => completedSteps.includes(s.id)).length;

  return (
    <nav aria-label="Progress" className="mb-8">
      {/* Compact phone version: step counter + progress bar */}
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Step {currentIndex + 1} of {steps.length}
          </span>
          <span className="font-display text-sm font-bold">{currentLabel}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full border border-ink/20 bg-muted">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${Math.max(8, Math.round(((doneCount + 0.5) / steps.length) * 100))}%` }}
          />
        </div>
      </div>
      <ol className="hidden items-start sm:flex">
        {steps.map((step, index) => {
          const status = statusFor(
            step.id,
            currentStep,
            completedSteps,
            warningSteps,
            errorSteps,
            index,
            currentIndex,
          );
          const isLast = index === steps.length - 1;
          const isCompleted = status === 'completed';
          const isCurrent = status === 'current';
          const isWarning = status === 'warning';
          const isFailed = status === 'failed';
          const isLocked = status === 'locked';

          return (
            <li key={step.id} className={clsx('flex items-start', !isLast && 'flex-1')}>
              <div className="flex flex-col items-center">
                <div
                  className={clsx(
                    'flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] font-display text-sm font-bold transition-colors',
                    isCompleted && 'border-ink bg-primary text-primary-foreground',
                    isCurrent && 'border-ink bg-brand-400 text-foreground shadow-pop-sm',
                    isWarning && 'border-ink bg-warning text-warning-foreground',
                    isFailed && 'border-ink bg-error text-error-foreground',
                    isLocked && 'border-border bg-muted text-muted-foreground opacity-60',
                    (!isCompleted && !isCurrent && !isWarning && !isFailed && !isLocked) &&
                      'border-border bg-muted text-muted-foreground',
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : isFailed ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  ) : isWarning ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 9v4" />
                      <path d="M12 17h.01" />
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    </svg>
                  ) : isLocked ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={clsx(
                    'mt-2 hidden text-center font-mono text-[10px] uppercase tracking-[0.1em] sm:block',
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
                    isCompleted ? 'bg-ink' : 'bg-border',
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