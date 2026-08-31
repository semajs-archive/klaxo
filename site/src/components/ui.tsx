import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/* ---------------------------------------------------------------- buttons */

type Variant = 'primary' | 'ghost' | 'on-ink' | 'on-ink-ghost';

// Every variant states its own border colour. Leaving a `border-transparent`
// in the base and overriding it per variant is a coin-flip: same specificity,
// and these class names are not merged.
const variants: Record<Variant, string> = {
  primary: 'border-rose bg-rose text-white hover:border-rose-deep hover:bg-rose-deep',
  ghost: 'border-line text-ink hover:border-ink hover:bg-white/55',
  'on-ink': 'border-white bg-white text-ink hover:border-[#e8e9f0] hover:bg-[#e8e9f0]',
  'on-ink-ghost': 'border-white/35 text-on-ink hover:border-white hover:bg-white/10',
};

const buttonBase =
  'inline-flex min-h-12 items-center justify-center rounded-[8px] border px-[22px] ' +
  'text-[0.9375rem] font-semibold tracking-[-0.01em] whitespace-nowrap ' +
  'transition-[transform,background-color,border-color,color] duration-200 ease-out-expo ' +
  'active:translate-y-px active:scale-[0.99]';

export function ButtonLink({
  href,
  variant = 'primary',
  size,
  className,
  children,
  ...rest
}: {
  href: string;
  variant?: Variant;
  size?: 'sm';
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, 'href' | 'className' | 'children'>) {
  const classes = cn(buttonBase, variants[variant], size === 'sm' && 'min-h-11 px-[18px] text-sm', className);

  // Anything pointing at the app is a real cross-origin navigation, not a
  // client-side route, so it must be a plain anchor.
  if (href.startsWith('http')) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ layout */

export function Wrap({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-[1240px] px-6', className)}>{children}</div>;
}

export function Band({
  deep = false,
  className,
  children,
}: {
  deep?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn('py-20 sm:py-24', deep && 'bg-paper-deep', className)}>
      <Wrap>{children}</Wrap>
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  lede,
  className,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  className?: string;
}) {
  return (
    <div className={cn('max-w-[600px]', className)}>
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <h2 className="text-[clamp(1.85rem,3.4vw,2.85rem)] font-bold leading-[1.06]">{title}</h2>
      {lede && <p className="prose-voice mt-[18px]">{lede}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------- cards */

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-[12px] border border-line-soft bg-surface p-7',
        'transition-[transform,border-color,box-shadow] duration-300 ease-out-expo',
        'hover:-translate-y-0.5 hover:border-rose-line hover:shadow-[0_18px_40px_-28px_rgba(25,28,43,0.45)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Check({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-[18px] w-[18px] shrink-0 text-rose', className)}
      aria-hidden="true"
    >
      <path d="m4 10.5 4 4 8-9" />
    </svg>
  );
}
