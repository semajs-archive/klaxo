'use client';

import { useEffect, useState } from 'react';

/**
 * Says out loud when nothing is generating the courses.
 *
 * Without a provider configured the app answers from fixtures, and a course
 * full of placeholder lessons looks exactly like a real one. Someone could
 * revise from it.
 *
 * It has to stay small. The first version took a fifth of a phone screen on
 * every page and told the reader to open a file they cannot open on a phone,
 * so the long version is desktop-only and the command goes with it.
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
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-2 text-[0.8125rem] sm:px-6 lg:px-8">
        <span aria-hidden="true" className="text-base leading-none">·</span>
        <p className="min-w-0">
          <span className="font-semibold">Example answers.</span>{' '}
          <span className="hidden sm:inline">
            No AI is connected yet, so lessons and questions are placeholder text. Run{' '}
            <code className="rounded bg-black/5 px-1 py-0.5 font-mono text-[0.75rem]">
              npm run ai:setup
            </code>{' '}
            to use your own material.
          </span>
          <span className="sm:hidden">Lessons are placeholder text until an AI is connected.</span>
        </p>
      </div>
    </div>
  );
}
