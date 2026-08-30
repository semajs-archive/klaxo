import Link from 'next/link';
import { Wordmark } from '@/components/Wordmark';

/**
 * Share-link shell for students. No teacher navigation and no sign-in prompt:
 * a learner who followed a link is not a customer being sold to.
 */
export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="rounded-xl text-foreground transition-opacity hover:opacity-80"
            aria-label="KLAXO"
          >
            <Wordmark />
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
