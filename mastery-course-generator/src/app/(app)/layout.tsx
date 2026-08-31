import Link from 'next/link';
import { HeaderNav, BottomNav, AccountMenu } from '@/components/SiteNav';
import { Wordmark } from '@/components/Wordmark';

/** Signed-in product shell: app nav on top, thumb-reachable tabs on phones. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center rounded-xl text-foreground transition-opacity hover:opacity-80"
            aria-label="KLAXO — go to my courses"
          >
            <Wordmark />
          </Link>
          <div className="flex items-center gap-3">
            <HeaderNav />
            <AccountMenu />
          </div>
        </div>
      </header>
      {/* The phone's bottom bar is fixed, so the page has to end above it —
          plus the home indicator underneath it. */}
      <main className="relative mx-auto w-full max-w-6xl px-4 pt-8 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-10 lg:px-8 lg:pt-10">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
