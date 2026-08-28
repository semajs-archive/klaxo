'use client';

import { clsx } from 'clsx';

interface Step {
  id: string;
  label: string;
}

export function StepIndicator({ steps, currentStep, completedSteps }: { steps: Step[]; currentStep: string; completedSteps: string[] }) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <li key={step.id} className="flex items-center">
              <div className="flex items-center">
                <div
                  className={clsx(
                    'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors',
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isCurrent
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={clsx(
                    'ml-2 text-sm font-medium hidden sm:block',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={clsx(
                    'hidden grow lg:block h-0.5 mx-4',
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