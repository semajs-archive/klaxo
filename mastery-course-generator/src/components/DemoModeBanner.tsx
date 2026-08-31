'use client';

import { useEffect, useState } from 'react';

/**
 * Says out loud when nothing is generating the courses.
 *
 * Without a provider configured the app answers from fixtures, and a course
 * full of placeholder lessons looks exactly like a real one. Someone could
 * revise from it. So when there is no AI connected, every screen says so —
 * once, quietly, at the top, with the one thing to do about it.
 */
export function DemoModeBanner() {
  const [state, setState] = useState<'unknown' | 'real' | 'demo'>('unknown');

  useEffect(() => {
    let cancelled = false;

    fetch('/api/ai-status')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setState(data.realAiEnabled ? 'real' : 'demo');
      })
      .catch(() => {
        // If the check itself fails, say nothing rather than crying wolf.
        if (!cancelled) setState('real');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state !== 'demo') return null;

  return (
    <div className="border-b border-warning/30 bg-warning-subtle text-warning-subtle-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm sm:px-6 lg:px-8">
        <span className="font-semibold">No AI connected.</span>
        <span>
          Courses are filled with example text, not real material. See{' '}
          <code className="rounded bg-black/5 px-1 py-0.5 font-mono text-[0.8125rem]">
            docs/connect-an-ai.md
          </code>{' '}
          to switch it on.
        </span>
      </div>
    </div>
  );
}
