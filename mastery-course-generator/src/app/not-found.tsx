import Link from 'next/link';
import { Wordmark } from '@/components/Wordmark';
import { Button } from '@/components/ui/Button';

/**
 * The catch-all page.
 *
 * Routes that used to exist (sign-in, share links) are gone, and old links to
 * them landed on a bare black "404" with no header, no navigation and no way
 * back except the browser button. A dead end should still look like the app
 * and offer the way out.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/study" className="inline-flex min-h-11 items-center" aria-label="KLAXO">
            <Wordmark />
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-[52ch]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Nothing here
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
            That page does not exist.
          </h1>
          <p className="mt-3 font-serif text-[1.0625rem] leading-relaxed text-foreground-soft">
            It may have been a link to something this app no longer has, like a sign-in page.
            There are no accounts any more: your material is simply here when you open it.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/study">
              <Button size="lg">Go to Study</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">
                Your material
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
