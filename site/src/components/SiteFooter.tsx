import Link from 'next/link';
import { Wrap } from '@/components/ui';
import { Wordmark } from '@/components/Wordmark';
import { NAV } from '@/lib/nav';
import { appHref } from '@/lib/cn';

const REPO = 'https://github.com/semajs-archive/klaxo';

export function SiteFooter() {
  return (
    <footer className="border-t border-line-soft bg-paper-deep">
      <Wrap className="grid gap-10 py-14 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Wordmark />
          <p className="prose-voice mt-4 max-w-[34ch] text-[1rem]">
            The material you already teach from, laid out as a course that runs in an order that
            holds.
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
              <a href={appHref('/login')} className="text-[0.9375rem] font-medium text-ink-2 hover:text-rose">
                Sign in
              </a>
            </li>
            <li>
              <a href={appHref('/login?mode=signup')} className="text-[0.9375rem] font-medium text-ink-2 hover:text-rose">
                Create an account
              </a>
            </li>
            <li>
              <a href={REPO} className="text-[0.9375rem] font-medium text-ink-2 hover:text-rose">
                Source code
              </a>
            </li>
          </ul>
        </div>
      </Wrap>

      <div className="border-t border-line-soft">
        <Wrap className="flex flex-col gap-2 py-6 text-[0.8125rem] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <span>KLAXO — curriculum built from your own material</span>
          <span>Free and open source, self-hostable</span>
        </Wrap>
      </div>
    </footer>
  );
}
