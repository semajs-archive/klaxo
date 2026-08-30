import Link from 'next/link';
import { Wordmark } from '@/components/Wordmark';

/**
 * The doorway between the site and the app: no marketing nav to wander back
 * into, no app nav that is not usable yet.
 */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="rounded-xl text-foreground transition-opacity hover:opacity-80"
            aria-label="KLAXO home"
          >
            <Wordmark />
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
          <Link href="/" className="font-semibold hover:text-foreground">
            ← Back to the site
          </Link>
          <Link href="/for-educators" className="font-semibold hover:text-foreground">
            What is KLAXO?
          </Link>
        </div>
      </footer>
    </div>
  );
}
