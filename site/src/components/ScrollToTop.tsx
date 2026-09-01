'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Send each new page to the top.
 *
 * The App Router keeps the scroll position across a client-side navigation, so
 * following a link from half-way down one page lands you half-way down the
 * next — under its headline. Worse here, because the page also animates in
 * from 10px down, so the reader sees a cut-off title and assumes it is broken.
 *
 * This lives in the layout, NOT in `template.tsx`. The template remounts on
 * every navigation, so a ref inside it resets each time and can never tell a
 * first render from a route change — which is exactly the bug this replaces.
 * The layout persists, so the ref actually remembers.
 *
 * Two things are deliberately left alone:
 * - a URL with a hash, so in-page anchors still land on their target;
 * - back and forward, which the browser restores itself.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const previous = useRef<string | null>(null);
  const poppingHistory = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      poppingHistory.current = true;
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const isFirstRender = previous.current === null;
    const changedRoute = previous.current !== pathname;
    previous.current = pathname;

    if (isFirstRender || !changedRoute) return;

    if (poppingHistory.current) {
      poppingHistory.current = false;
      return;
    }

    if (window.location.hash) return;

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
}
