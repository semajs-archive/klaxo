'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ButtonLink, Wrap } from '@/components/ui';
import { Wordmark } from '@/components/Wordmark';
import { appHref, cn } from '@/lib/cn';
import { NAV } from '@/lib/nav';

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lifted, setLifted] = useState(false);
  const reduceMotion = useReducedMotion();

  // The header only grows a hairline once the page has moved under it.
  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isCurrent = (href: string) => pathname === href || pathname === `${href}/`;

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ease-out-expo',
        lifted ? 'border-b border-line-soft bg-paper/85 backdrop-blur-xl' : 'border-b border-transparent',
      )}
    >
      <Wrap className="flex h-[72px] items-center gap-7">
        <Link href="/" className="shrink-0" aria-label="KLAXO home" onClick={() => setOpen(false)}>
          <Wordmark />
        </Link>

        <nav aria-label="Site" className="ml-3 hidden gap-[26px] lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent(item.href) ? 'page' : undefined}
              className="group relative py-1 text-[0.9375rem] font-medium text-ink-2 transition-colors hover:text-rose"
            >
              {item.label}
              {/* The active page keeps a rose underline; hover draws it in. */}
              <span
                className={cn(
                  'absolute inset-x-0 -bottom-0.5 h-px origin-left bg-rose transition-transform duration-300 ease-out-expo',
                  isCurrent(item.href) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                )}
              />
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <div className="hidden items-center gap-2.5 sm:flex">
            <ButtonLink href={appHref('/login')} variant="ghost" size="sm">
              Sign in
            </ButtonLink>
            <ButtonLink href={appHref('/login?mode=signup')} size="sm">
              Open KLAXO
            </ButtonLink>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="grid h-11 w-11 place-items-center rounded-[8px] border border-line text-ink lg:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
              {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </Wrap>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-line-soft bg-paper lg:hidden"
          >
            <Wrap className="py-2">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[56px] items-center border-b border-line-soft text-[1.0625rem] font-medium last:border-0"
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2.5 py-4">
                <ButtonLink href={appHref('/login?mode=signup')}>Open KLAXO</ButtonLink>
                <ButtonLink href={appHref('/login')} variant="ghost">
                  Sign in
                </ButtonLink>
              </div>
            </Wrap>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
