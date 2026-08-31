import { Wordmark } from '@/components/Wordmark';
import { siteHref } from '@/lib/site';

/**
 * The doorway between the site and the app: no marketing nav to wander back
 * into, no app nav that is not usable yet. The links out lead to the public
 * site, which is a separate deployment.
 */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6 lg:px-8">
          <a
            href={siteHref('/')}
            className="inline-flex min-h-11 items-center rounded-xl text-foreground transition-opacity hover:opacity-80"
            aria-label="KLAXO home"
          >
            <Wordmark />
          </a>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-10 sm:px-6 lg:px-8">{children}</main>
      <footer className="border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
          <a href={siteHref('/')} className="inline-flex min-h-11 items-center font-semibold hover:text-foreground">
            ← Back to the site
          </a>
          <a href={siteHref('/what-you-get')} className="inline-flex min-h-11 items-center font-semibold hover:text-foreground">
            What is KLAXO?
          </a>
        </div>
      </footer>
    </div>
  );
}
