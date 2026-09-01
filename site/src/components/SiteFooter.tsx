import Link from 'next/link';
import { Wrap } from '@/components/ui';
import { Wordmark } from '@/components/Wordmark';
import { NAV } from '@/lib/nav';
import { START_HREF } from '@/lib/cn';

export function SiteFooter() {
  return (
    <footer className="border-t border-line-soft bg-paper-deep pb-[env(safe-area-inset-bottom)]">
      <Wrap className="grid gap-10 py-14 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="prose-voice mt-4 max-w-[34ch] text-[1rem]">
            A course built from the material you already teach from, with every line still tied
            to the page it came from.
          </p>
        </div>

        <nav aria-label="Pages">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-3">
            The site
          </p>
          <ul className="mt-4 grid gap-3">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-[0.9375rem] font-medium text-ink-2 hover:text-rose">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-3">
            Get in
          </p>
          <ul className="mt-4 grid gap-3">
            <li>
              <a href={START_HREF} className="text-[0.9375rem] font-medium text-ink-2 hover:text-rose">
                Open KLAXO
              </a>
            </li>
          </ul>
        </div>
      </Wrap>

      <div className="border-t border-line-soft">
        <Wrap className="flex flex-col gap-2 py-6 text-[0.8125rem] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <span>KLAXO — a course you can check</span>
          <span>Free while it is in beta</span>
        </Wrap>
      </div>
    </footer>
  );
}
