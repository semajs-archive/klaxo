'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';

/**
 * In-app navigation only. The public marketing site has its own header, so
 * nothing here links back out to it except sign-out.
 */
const links = [{ href: '/dashboard', label: 'My courses' }];

function isActive(pathname: string, href: string) {
  return pathname.startsWith(href);
}

export function HeaderNav() {
  const pathname = usePathname();
  const me = useMe();
  if (me?.role === 'student') return null;
  return (
    <nav aria-label="Primary" className="hidden items-center gap-1.5 sm:flex">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
            isActive(pathname, link.href)
              ? 'bg-secondary text-foreground'
              : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

interface Me {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  isGuest: boolean;
}

/** `undefined` while loading, `null` when signed out. */
function useMe(): Me | null | undefined {
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setMe(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setMe(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return me;
}

export function AccountMenu() {
  const router = useRouter();
  const loaded = useMe();
  const [signedOut, setSignedOut] = useState(false);
  const me = signedOut ? null : loaded;
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (me === undefined) return <div className="h-9 w-20" aria-hidden="true" />;

  if (!me || me.isGuest) {
    return (
      <Link
        href="/login"
        className="rounded-full border-[1.5px] border-ink bg-brand-500 px-4 py-1.5 font-display text-sm font-bold text-on-brand shadow-pop-sm transition-all hover:bg-brand-400 dark:border-foreground dark:bg-foreground dark:text-background dark:hover:bg-foreground/90 active:translate-y-[2px] active:shadow-none"
      >
        Sign in
      </Link>
    );
  }

  const name = me.displayName || me.email.split('@')[0];

  if (me.role === 'student') {
    return (
      <span className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold">{name}</span>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold hover:bg-secondary/70"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {name}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border-[1.5px] border-ink bg-card shadow-pop"
        >
          <div className="border-b border-border px-4 py-2.5 text-xs text-muted-foreground">
            {me.email}
          </div>
          <button
            type="button"
            role="menuitem"
            className="w-full px-4 py-2.5 text-left text-sm font-semibold hover:bg-secondary"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              setOpen(false);
              setSignedOut(true);
              router.push('/');
              router.refresh();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const me = useMe();
  if (me?.role === 'student') return null;
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t-[1.5px] border-ink bg-card pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <div className="grid" style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}>
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-semibold',
                active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                <path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Z" />
                <path d="M4 19a2 2 0 0 0 2 2h13" />
              </svg>
              <span className={cn(active && 'border-b-2 border-brand-500')}>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
