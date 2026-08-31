import { Wordmark } from '@/components/Wordmark';
import { siteHref } from '@/lib/site';

/**
 * Share-link shell for students. No educator navigation and no sign-in prompt:
 * a learner who followed a link is not a customer being sold to.
 */
export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6 lg:px-8">
          <a
            href={siteHref('/')}
            className="inline-flex min-h-11 items-center rounded-xl text-foreground transition-opacity hover:opacity-80"
            aria-label="KLAXO"
          >
            <Wordmark />
          </a>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
