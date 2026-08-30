'use client';

/**
 * Marketing-site header.
 *
 * This is the public front door: it never shows app navigation. The only way
 * into the product from here is the sign-in button, which becomes a direct
 * link to the dashboard once a session exists.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wordmark } from '@/components/Wordmark';
import { cn } from '@/lib/cn';

export const siteLinks = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/for-educators', label: 'For educators' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSignedIn(Boolean(data.user) && !data.user.isGuest);
      })
      .catch(() => {
        if (!cancelled) setSignedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="rounded-xl text-foreground transition-opacity hover:opacity-80"
          aria-label="KLAXO home"
        >
          <Wordmark />
        </Link>

        <nav aria-label="Site" className="hidden items-center gap-1 lg:flex">
          {siteLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-full px-3.5 py-2 text-sm font-semibold transition-colors',
                pathname === link.href
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            {signedIn === null ? (
              <div className="h-9 w-24" aria-hidden="true" />
            ) : signedIn ? (
              <Link
                href="/dashboard"
                className="rounded-full border-[1.5px] border-ink bg-brand-500 px-4 py-2 font-display text-sm font-bold text-on-brand shadow-pop-sm transition-all hover:bg-brand-400 dark:border-foreground dark:bg-foreground dark:text-background dark:hover:bg-foreground/90 active:translate-y-[2px] active:shadow-none"
              >
                Go to my courses
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                >
                  Sign in
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="rounded-full border-[1.5px] border-ink bg-brand-500 px-4 py-2 font-display text-sm font-bold text-on-brand shadow-pop-sm transition-all hover:bg-brand-400 dark:border-foreground dark:bg-foreground dark:text-background dark:hover:bg-foreground/90 active:translate-y-[2px] active:shadow-none"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-11 w-11 place-items-center rounded-xl border-[1.5px] border-ink bg-card shadow-pop-sm active:translate-y-[2px] active:shadow-none lg:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t-[1.5px] border-ink bg-card lg:hidden">
          <nav aria-label="Site" className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
            {siteLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex min-h-[52px] items-center border-b border-border text-base font-semibold last:border-0"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 pb-2">
              {signedIn ? (
                <Link
                  href="/dashboard"
                  className="flex min-h-[52px] items-center justify-center rounded-xl border-[1.5px] border-ink bg-brand-500 font-display text-base font-bold text-on-brand shadow-pop-sm dark:border-foreground dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
                >
                  Go to my courses
                </Link>
              ) : (
                <>
                  <Link
                    href="/login?mode=signup"
                    className="flex min-h-[52px] items-center justify-center rounded-xl border-[1.5px] border-ink bg-brand-500 font-display text-base font-bold text-on-brand shadow-pop-sm dark:border-foreground dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
                  >
                    Get started
                  </Link>
                  <Link
                    href="/login"
                    className="flex min-h-[52px] items-center justify-center rounded-xl border-[1.5px] border-ink bg-card font-display text-base font-bold shadow-pop-sm"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
