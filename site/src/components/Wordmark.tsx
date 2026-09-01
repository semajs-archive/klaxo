import { cn } from '@/lib/cn';

/**
 * "The Citation" — lines of a course, with one tracing down and out to the
 * source it came from. It draws the claim the whole site leads with.
 *
 * The trace and its dot carry the accent at display size. In a tile the mark
 * goes monochrome: at 18px a second colour turns into mud.
 */
export function CitationMark({
  className,
  accent = false,
}: {
  className?: string;
  accent?: boolean;
}) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="3.4" width="8" height="2" rx="1" fill="currentColor" />
      <rect x="3" y="7.4" width="13" height="2" rx="1" fill="currentColor" />
      <path
        d="M5 11.6v1.7a1.5 1.5 0 0 0 1.5 1.5H11"
        stroke={accent ? 'var(--color-rose)' : 'currentColor'}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14.1" cy="14.8" r="1.9" fill={accent ? 'var(--color-rose)' : 'currentColor'} />
    </svg>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-ink', className)}>
      <span
        aria-hidden="true"
        className="grid h-[26px] w-[26px] place-items-center rounded-[7px] bg-ink text-paper"
      >
        <CitationMark className="h-[13px] w-[13px]" />
      </span>
      <span className="text-[1.25rem] font-bold tracking-[-0.03em]">KLAXO</span>
    </span>
  );
}
