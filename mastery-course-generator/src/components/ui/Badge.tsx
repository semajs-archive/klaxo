'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'outline';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Visual style of the badge. */
  variant?: BadgeVariant;
  /** Render a leading status dot (color matches the variant). */
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary:
    'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  success:
    'bg-success-subtle text-success-subtle-foreground border border-success/20',
  warning:
    'bg-warning-subtle text-warning-subtle-foreground border border-warning/20',
  error:
    'bg-error-subtle text-error-subtle-foreground border border-error/20',
  info: 'bg-info-subtle text-info-subtle-foreground border border-info/20',
  outline:
    'border border-border bg-transparent text-foreground',
};

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-primary-foreground',
  secondary: 'bg-secondary-foreground',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
  outline: 'bg-muted-foreground',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', dot = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        role="status"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] whitespace-nowrap transition-colors',
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        {dot && (
          <span
            aria-hidden="true"
            className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotStyles[variant])}
          />
        )}
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';