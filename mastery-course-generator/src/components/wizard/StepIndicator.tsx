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

  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-start">
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
            <li key={step.id} className="flex items-start">
              <div className="flex flex-col items-center">
                <div
                  className={clsx(
                    'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background',
                    isWarning && 'bg-warning text-warning-foreground',
                    isFailed && 'bg-error text-error-foreground',
                    isLocked && 'bg-muted text-muted-foreground opacity-50',
                    (!isCompleted && !isCurrent && !isWarning && !isFailed && !isLocked) &&
                      'bg-muted text-muted-foreground',
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
                    'mt-2 text-sm font-medium hidden sm:block',
                    isCurrent
                      ? 'text-foreground'
                      : isWarning
                      ? 'text-warning'
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
                    'hidden grow lg:block h-0.5 mt-5 mx-1',
                    isCompleted ? 'bg-primary' : 'bg-muted',
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