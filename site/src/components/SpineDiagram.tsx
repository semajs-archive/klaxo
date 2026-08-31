'use client';

import { useRef } from 'react';
import { AnimatedBeam } from '@/components/AnimatedBeam';

const SOURCES = [
  { label: 'Syllabus.pdf', hint: 'Unit 2 outline' },
  { label: 'Lecture notes', hint: 'Weeks 3–4' },
  { label: 'Photo of p. 214', hint: 'Worked example' },
];

const OBJECTIVES = [
  { n: '01', text: 'Estimate the slope of a curve from a table of values.', from: 'Lecture notes' },
  { n: '02', text: 'Define the derivative as a limit of average rates.', from: 'Photo of p. 214' },
  { n: '03', text: 'Apply the power rule to polynomial functions.', from: 'Syllabus.pdf' },
];

/**
 * The hero is the product's actual mechanism rather than a screenshot: loose
 * material on the left resolving into an ordered spine on the right, with the
 * beam travelling along the dependency it just satisfied.
 */
export function SpineDiagram() {
  const container = useRef<HTMLDivElement>(null);
  // Named rather than an array: `noUncheckedIndexedAccess` makes indexed refs
  // possibly-undefined, and the beam needs a concrete ref on both ends.
  const sourceA = useRef<HTMLDivElement>(null);
  const sourceB = useRef<HTMLDivElement>(null);
  const sourceC = useRef<HTMLDivElement>(null);
  const objA = useRef<HTMLDivElement>(null);
  const objB = useRef<HTMLDivElement>(null);
  const objC = useRef<HTMLDivElement>(null);
  const sourceRefs = [sourceA, sourceB, sourceC];
  const objectiveRefs = [objA, objB, objC];

  return (
    <div ref={container} className="relative w-full">
      <div className="grid gap-8 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] sm:items-center sm:gap-12">
        <div className="flex flex-col gap-4">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-3">
            What you hand over
          </p>
          {SOURCES.map((source, i) => (
            <div
              key={source.label}
              ref={sourceRefs[i]}
              className="rounded-[10px] border border-line-soft bg-surface px-4 py-3 shadow-[0_10px_24px_-22px_rgba(25,28,43,0.7)]"
            >
              <p className="truncate text-sm font-semibold">{source.label}</p>
              <p className="truncate text-xs text-ink-3">{source.hint}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-3">
            What comes back, in order
          </p>
          {OBJECTIVES.map((objective, i) => (
            <div
              key={objective.n}
              ref={objectiveRefs[i]}
              className="rounded-[10px] border border-line-soft bg-surface px-4 py-3 shadow-[0_10px_24px_-22px_rgba(25,28,43,0.7)]"
            >
              <div className="flex gap-3">
                <span className="mt-px text-[0.6875rem] font-semibold tabular-nums text-rose">
                  {objective.n}
                </span>
                <div className="min-w-0">
                  <p className="text-sm leading-snug">{objective.text}</p>
                  <p className="mt-1.5 truncate text-xs text-ink-3">from {objective.from}</p>
                </div>
              </div>
            </div>
          ))}
          <p className="mt-1 text-xs text-ink-3">
            <span className="tabular-nums">03</span> is held back until{' '}
            <span className="tabular-nums">02</span> is met — nothing depends on something the class
            has not seen.
          </p>
        </div>
      </div>

      <AnimatedBeam containerRef={container} fromRef={sourceB} toRef={objA} curvature={-26} delay={0} className="hidden sm:block" />
      <AnimatedBeam containerRef={container} fromRef={sourceC} toRef={objB} curvature={18} delay={0.9} className="hidden sm:block" />
      <AnimatedBeam containerRef={container} fromRef={sourceA} toRef={objC} curvature={-40} delay={1.8} className="hidden sm:block" />
    </div>
  );
}
