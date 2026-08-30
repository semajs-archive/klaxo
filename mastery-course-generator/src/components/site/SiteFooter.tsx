import Link from 'next/link';
import { Wordmark } from '@/components/Wordmark';

const columns = [
  {
    heading: 'Product',
    links: [
      { href: '/how-it-works', label: 'How it works' },
      { href: '/for-teachers', label: 'For teachers' },
      { href: '/pricing', label: 'Pricing' },
    ],
  },
  {
    heading: 'Project',
    links: [
      { href: '/about', label: 'About' },
      { href: 'https://github.com/semajs-archive/klaxo', label: 'Source code' },
    ],
  },
  {
    heading: 'Get in',
    links: [
      { href: '/login', label: 'Sign in' },
      { href: '/login?mode=signup', label: 'Create an account' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t-[1.5px] border-ink bg-card">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-8">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
            Curriculum engineering for teachers: real source material in, a structured
            mastery course out.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.heading}>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {column.heading}
            </p>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm font-semibold hover:text-primary hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>KLAXO — curriculum engineering</span>
          <span>Open source · self-hostable</span>
        </div>
      </div>
    </footer>
  );
}
