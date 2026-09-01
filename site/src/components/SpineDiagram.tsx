'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatedBeam } from '@/components/AnimatedBeam';

const PAIRS = [
  {
    source: 'Lecture notes',
    hint: 'Weeks 3–4',
    n: '01',
    objective: 'Estimate the slope of a curve from a table of values.',
  },
  {
    source: 'Photo of p. 214',
    hint: 'Worked example',
    n: '02',
    objective: 'Define the derivative as a limit of average rates.',
  },
  {
    source: 'Syllabus.pdf',
    hint: 'Unit 2 outline',
    n: '03',
    objective: 'Apply the power rule to polynomial functions.',
  },
];

/**
 * The hero is the product's mechanism rather than a screenshot: the material
 * you hand over on one side, the objective it produced on the other, and a
 * line tracing between them.
 *
 * Two layouts, not one layout squeezed. Wide: two columns, lines hopping the
 * gap from the right edge of a source to the left edge of its objective.
 * Phone: a single vertical run — source, then the thing it produced, straight
 * down — because two columns at 390px leaves four words to a line.
 */
export function SpineDiagram() {
  const container = useRef<HTMLDivElement>(null);

  const sourceA = useRef<HTMLDivElement>(null);
  const sourceB = useRef<HTMLDivElement>(null);
  const sourceC = useRef<HTMLDivElement>(null);
  const objA = useRef<HTMLDivElement>(null);
  const objB = useRef<HTMLDivElement>(null);
  const objC = useRef<HTMLDivElement>(null);

  const phoneSourceA = useRef<HTMLDivElement>(null);
  const phoneSourceB = useRef<HTMLDivElement>(null);
  const phoneSourceC = useRef<HTMLDivElement>(null);
  const phoneObjA = useRef<HTMLDivElement>(null);
  const phoneObjB = useRef<HTMLDivElement>(null);
  const phoneObjC = useRef<HTMLDivElement>(null);

  const wideSources = [sourceA, sourceB, sourceC];
  const wideObjectives = [objA, objB, objC];
  const phoneSources = [phoneSourceA, phoneSourceB, phoneSourceC];
  const phoneObjectives = [phoneObjA, phoneObjB, phoneObjC];

  // The two layouts are separate DOM, so the beams have to know which one is
  // on screen. Matches the `sm` breakpoint the grid switches at.
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 640px)');
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const sources = wide ? wideSources : phoneSources;
  const objectives = wide ? wideObjectives : phoneObjectives;

  return (
    <div ref={container} className="relative w-full">
      {/* ---------------------------------------------------- phone: one run */}
      <div className="grid gap-3 sm:hidden">
        {PAIRS.map((pair, i) => (
          <div key={pair.n} className="grid gap-3">
            <div
              ref={phoneSources[i]}
              className="rounded-[10px] border border-line-soft bg-surface px-4 py-3"
            >
              <p className="truncate text-sm font-semibold">{pair.source}</p>
              <p className="truncate text-xs text-ink-3">{pair.hint}</p>
            </div>
            <div
              ref={phoneObjectives[i]}
              className="ml-7 rounded-[10px] border border-line-soft bg-surface px-4 py-3"
            >
              <div className="flex gap-3">
                <span className="mt-px text-[0.6875rem] font-semibold tabular-nums text-rose">
                  {pair.n}
                </span>
                <p className="text-sm leading-snug">{pair.objective}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ------------------------------------------------- wide: two columns */}
      <div className="hidden gap-12 sm:grid sm:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] sm:items-center">
        <div className="flex flex-col gap-5">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-3">
            What you hand over
          </p>
          {PAIRS.map((pair, i) => (
            <div
              key={pair.source}
              ref={wideSources[i]}
              className="rounded-[10px] border border-line-soft bg-surface px-4 py-3 shadow-[0_10px_24px_-22px_rgba(25,28,43,0.7)]"
            >
              <p className="truncate text-sm font-semibold">{pair.source}</p>
              <p className="truncate text-xs text-ink-3">{pair.hint}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-5">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-3">
            What comes back, in order
          </p>
          {PAIRS.map((pair, i) => (
            <div
              key={pair.n}
              ref={wideObjectives[i]}
              className="rounded-[10px] border border-line-soft bg-surface px-4 py-3 shadow-[0_10px_24px_-22px_rgba(25,28,43,0.7)]"
            >
              <div className="flex gap-3">
                <span className="mt-px text-[0.6875rem] font-semibold tabular-nums text-rose">
                  {pair.n}
                </span>
                <p className="text-sm leading-snug">{pair.objective}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edge to edge, never through a card: right side of a source to the left
          side of its objective on a wide screen, bottom to top on a phone. */}
      {PAIRS.map((pair, i) => (
        <AnimatedBeam
          key={pair.n}
          containerRef={container}
          fromRef={sources[i]!}
          toRef={objectives[i]!}
          fromSide={wide ? 'right' : 'bottom'}
          toSide={wide ? 'left' : 'top'}
          curvature={wide ? 18 : 0}
          delay={i * 0.9}
        />
      ))}
    </div>
  );
}
