import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Bricolage_Grotesque, Inter, Spline_Sans_Mono } from 'next/font/google';
import { HeaderNav, BottomNav } from '@/components/SiteNav';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  weight: ['500', '600', '700', '800'],
});
const splineMono = Spline_Sans_Mono({
  subsets: ['latin'],
  variable: '--font-spline-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'KLAXO — Curriculum Engineering',
  description:
    'KLAXO transforms messy educational material into structured, grounded, mastery-oriented courses.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-foreground"
      >
        {/* Klaxon horn */}
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M4 14V10c0-.6.4-1 1-1h3l6-5c.7-.5 1.5 0 1.5.8v14.4c0 .8-.8 1.3-1.5.8l-6-5H5c-.6 0-1-.4-1-1Z"
            fill="currentColor"
          />
          <path
            d="M18.5 9.5c.9 1.5.9 3.5 0 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="font-display text-[21px] font-extrabold tracking-tight">klaxo</span>
    </span>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${bricolage.variable} ${splineMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link
              href="/dashboard"
              className="rounded-xl text-foreground transition-opacity hover:opacity-80 focus-visible:outline-none"
              aria-label="KLAXO — go to dashboard"
            >
              <Wordmark />
            </Link>
            <HeaderNav />
          </div>
        </header>
        <main className="relative mx-auto w-full max-w-6xl px-4 py-8 pb-24 sm:px-6 sm:pb-10 lg:px-8 lg:py-10">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
