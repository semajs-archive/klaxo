'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { START_HREF } from '@/lib/cn';

/**
 * The action, in reach of a thumb.
 *
 * On a phone the only button that matters should not be 900px up the page, so
 * it re-appears in a bar at the bottom once the hero has scrolled away. It
 * sits above the home indicator, and it is phone-only: on a laptop the header
 * button is always visible and this would just be clutter.
 */
export function MobileActionBar() {
  const [shown, setShown] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 520);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {shown && (
        <motion.div
          initial={reduceMotion ? false : { y: 90 }}
          animate={{ y: 0 }}
          exit={reduceMotion ? undefined : { y: 90 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-paper/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] sm:hidden"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.9375rem] font-semibold">Open KLAXO</p>
              <p className="truncate text-xs text-ink-3">No sign-up, no login</p>
            </div>
            <a
              href={START_HREF}
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-[8px] border border-rose bg-rose px-5 text-[0.9375rem] font-semibold text-on-rose"
            >
              Open the builder
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
