'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Reveal-on-scroll.
 *
 * Deliberately not a library: one transition, one distance, one easing, shared
 * with every other moving thing on the site so the motion reads as a system.
 * Once shown it stays shown — elements that re-animate on the way back up feel
 * like a bug rather than a flourish.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'header' | 'p';
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Anything already on screen at mount should not wait for a scroll.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );

    observer.observe(el);

    // Safety net: if the observer never fires — a background tab, a browser
    // that throttles offscreen work, anything unusual — the content must not
    // stay invisible. Reveal it anyway shortly after mount.
    const failsafe = window.setTimeout(() => {
      setShown(true);
      observer.disconnect();
    }, 1200);

    return () => {
      window.clearTimeout(failsafe);
      observer.disconnect();
    };
  }, []);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      data-shown={shown}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined }}
      className={cn('reveal', className)}
    >
      {children}
    </Tag>
  );
}
