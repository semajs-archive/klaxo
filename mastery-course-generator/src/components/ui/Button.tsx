'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-display font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 rounded-xl select-none';

    const chunky =
      'border-[1.5px] border-ink shadow-pop active:translate-y-[3px] active:shadow-none';

    const variants = {
      primary: `${chunky} bg-primary text-primary-foreground hover:bg-primary-500`,
      secondary: `${chunky} bg-brand-500 text-on-brand hover:bg-brand-400 dark:border-foreground dark:bg-foreground dark:text-background dark:hover:bg-foreground/90`,
      outline: `${chunky} bg-card text-foreground hover:bg-secondary`,
      ghost: 'hover:bg-secondary hover:text-foreground active:scale-[0.98]',
      destructive: `${chunky} bg-destructive text-destructive-foreground hover:bg-destructive/90`,
    };

    const sizes = {
      sm: 'h-9 rounded-lg px-3.5 text-xs',
      md: 'h-11 px-5 py-2 text-sm',
      lg: 'h-12 rounded-xl px-8 text-base',
    };

    return (
      <button
        ref={ref}
        type="button"
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';