import Link from 'next/link';
import { HeaderNav, BottomNav, AccountMenu } from '@/components/SiteNav';
import { Wordmark } from '@/components/Wordmark';

/** Signed-in product shell: app nav on top, thumb-reachable tabs on phones. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="rounded-xl text-foreground transition-opacity hover:opacity-80"
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
      <main className="relative mx-auto w-full max-w-6xl px-4 py-8 pb-24 sm:px-6 sm:pb-10 lg:px-8 lg:py-10">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
