import type { Metadata, Viewport } from 'next';
import { Newsreader, Schibsted_Grotesk } from 'next/font/google';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ScrollToTop } from '@/components/ScrollToTop';
import { MobileActionBar } from '@/components/MobileActionBar';
import './globals.css';

const schibsted = Schibsted_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-schibsted',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
});

export const metadata: Metadata = {
  title: {
    default: 'KLAXO — a course you can check, line by line',
    template: '%s — KLAXO',
  },
  description:
    'KLAXO builds a course from the material you already teach from, and keeps every line tied to the page it came from.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#e6e8ef',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${schibsted.variable} ${newsreader.variable}`}>
      <body className="flex min-h-screen flex-col">
        <ScrollToTop />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[8px] focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <MobileActionBar />
      </body>
    </html>
  );
}
