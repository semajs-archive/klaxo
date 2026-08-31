'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

/**
 * In-app navigation.
 *
 * There is no account menu and no sign-in: one person uses this, and it opens
 * straight into their material. Two places to be — what you are revising, and
 * everything you have built.
 */
const links = [
  { href: '/study', label: 'Study', Icon: StudyIcon },
  { href: '/dashboard', label: 'Material', Icon: MaterialIcon },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function StudyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 5.5C10.5 4.2 8.6 3.6 6 3.6c-.9 0-1.6.7-1.6 1.6v11c0 .9.7 1.6 1.6 1.6 2.6 0 4.5.6 6 1.9 1.5-1.3 3.4-1.9 6-1.9.9 0 1.6-.7 1.6-1.6v-11c0-.9-.7-1.6-1.6-1.6-2.6 0-4.5.6-6 1.9Z" />
      <path d="M12 5.5v14.2" />
    </svg>
  );
}

function MaterialIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h4l1.6 2H18a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 18 18H5.5A1.5 1.5 0 0 1 4 16.5Z" />
    </svg>
  );
}

export function HeaderNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="hidden items-center gap-1.5 sm:flex">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={isActive(pathname, link.href) ? 'page' : undefined}
          className={cn(
            'flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors',
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

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <div className="grid grid-cols-2">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-semibold',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <link.Icon className="h-5 w-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
