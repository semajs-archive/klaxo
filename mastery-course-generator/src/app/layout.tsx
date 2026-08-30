import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Inter, Spline_Sans_Mono } from 'next/font/google';
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
        className={`${inter.variable} ${bricolage.variable} ${splineMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
