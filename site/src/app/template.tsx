'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Page transitions.
 *
 * `template.tsx` remounts on every navigation, which is what makes this fire
 * on each route change. It is an enter-only transition on purpose: an exit
 * animation would hold the old page on screen while the new one is already
 * ready, which reads as lag rather than polish.
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
