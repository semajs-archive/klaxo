'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';

export interface WizardStepProps {
  children: ReactNode;
  className?: string;
  title: string;
  description?: string;
}

export function WizardStep({ children, className, title, description }: WizardStepProps) {
  return (
    <div className={clsx('space-y-6', className)}>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}