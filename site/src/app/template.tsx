'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Page transitions.
 *
 * `template.tsx` remounts on every navigation, which is what makes the enter
 * animation fire per route. Scroll position is handled by `ScrollToTop` in the
 * layout rather than here: this component cannot tell a first render from a
 * route change, because its own state resets on both.
 *
 * Enter-only on purpose. An exit animation holds the old page on screen after
 * the new one is ready, which reads as lag rather than polish.
 */
export default function Template({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
