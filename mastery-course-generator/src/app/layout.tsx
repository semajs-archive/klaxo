import type { Metadata, Viewport } from 'next';
import { Newsreader, Schibsted_Grotesk } from 'next/font/google';
import './globals.css';

/** Schibsted Grotesk carries everything structural: headings, UI, labels. */
const schibsted = Schibsted_Grotesk({
  subsets: ['latin'],
  variable: '--font-schibsted',
  weight: ['400', '500', '600', '700'],
});

/** Newsreader carries running prose, so explanation reads as explanation. */
const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  weight: ['400', '500'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'KLAXO — study from your own material',
  description:
    'Turns the notes, slides and chapters you revise from into a course with practice, and tracks what you actually know.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/**
 * Root layout holds only the document shell and fonts.
 *
 * Chrome is deliberately not here: the marketing site `(site)` and the product
 * `(app)` are two different experiences with two different headers, and each
 * group layout supplies its own.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${schibsted.variable} ${newsreader.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
