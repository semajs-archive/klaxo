import { CitationMark } from '@/components/Wordmark';

/*
  The pieces the homepage is mostly made of. Each one is a picture with a label,
  not a paragraph — the site's job is to show the product working, and every one
  of these is drawn from something KLAXO actually does.
*/

const PILE = [
  { name: 'Syllabus.pdf', meta: '14 pages' },
  { name: 'Lecture notes — wk 3', meta: 'Handwritten, photographed' },
  { name: 'Chapter 4 scan', meta: 'p. 198–226' },
  { name: 'Slides from last year', meta: '32 slides' },
  { name: 'Past paper questions', meta: 'Pasted in' },
];

const COURSE = [
  { n: '01', text: 'Estimate slope from a table of values', from: 'Lecture notes — wk 3' },
  { n: '02', text: 'Define the derivative as a limit', from: 'Chapter 4 scan, p. 214' },
  { n: '03', text: 'Apply the power rule', from: 'Syllabus.pdf' },
  { n: '04', text: 'Differentiate a polynomial', from: 'Slides from last year' },
  { n: '05', text: 'Use derivatives to find a maximum', from: 'Past paper questions' },
];

/** The centrepiece: what you start with, and what you end with. */
export function BeforeAfter() {
  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1.15fr]">
      <div className="rounded-[12px] border border-line-soft bg-surface p-5">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-3">
          Monday — what you have
        </p>
        <div className="mt-4 grid gap-2.5">
          {PILE.map((item, i) => (
            <div
              key={item.name}
              // Nudged out of true so the pile reads as a pile, not a table.
              style={{ transform: `rotate(${(i % 2 ? 1 : -1) * (0.25 + i * 0.12)}deg)` }}
              className="rounded-[8px] border border-line-soft bg-surface-2 px-3.5 py-2.5"
            >
              <p className="truncate text-[0.8125rem] font-semibold">{item.name}</p>
              <p className="truncate text-[0.75rem] text-ink-3">{item.meta}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid place-items-center py-2 lg:py-0">
        <svg
          viewBox="0 0 40 24"
          className="h-6 w-10 rotate-90 text-ink-3 lg:rotate-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 12h30M26 5l8 7-8 7" />
        </svg>
      </div>

      <div className="rounded-[12px] border border-rose-line bg-surface p-5">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-rose">
          Monday afternoon — what you have
        </p>
        <p className="mt-3 text-[0.9375rem] font-semibold">Unit 2 · Rates of change</p>
        <div className="mt-3 grid">
          {COURSE.map((item) => (
            <div key={item.n} className="flex gap-3 border-t border-line-soft py-2.5 first:border-0">
              <span className="mt-0.5 text-[0.6875rem] font-semibold tabular-nums text-rose">
                {item.n}
              </span>
              <div className="min-w-0">
                <p className="text-[0.8125rem] leading-snug">{item.text}</p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-[0.75rem] text-ink-3">
                  <CitationMark className="h-3 w-3 shrink-0" />
                  {item.from}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The pitch, shown: a generated line with the page it came from beside it. */
export function ProvenanceCard() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.05fr_auto_0.95fr] lg:items-center">
      <div className="rounded-[12px] border border-line-soft bg-surface p-5">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-3">
          KLAXO wrote this
        </p>
        <p className="prose-voice mt-3 text-[0.9375rem]">
          The derivative at a point is the limit of the average rate of change as the interval
          shrinks to nothing. On a table of values, that is the slope between two rows as the rows
          get closer together.
        </p>
        <p className="mt-4 flex items-center gap-2 border-t border-line-soft pt-4 text-[0.8125rem] text-rose">
          <CitationMark className="h-3.5 w-3.5 shrink-0" />
          Chapter 4 scan, p. 214
        </p>
      </div>

      <div className="grid place-items-center py-1 lg:py-0">
        <svg
          viewBox="0 0 40 24"
          className="h-6 w-10 rotate-90 text-rose lg:rotate-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 12h30M26 5l8 7-8 7" />
        </svg>
      </div>

      <div className="rounded-[12px] border border-line-soft bg-surface-2 p-5">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-3">
          Your page, p. 214
        </p>
        <div className="mt-4 grid gap-2" aria-hidden="true">
          <span className="h-2 w-4/5 rounded-full bg-line" />
          <span className="h-2 w-full rounded-full bg-line" />
          <span className="h-2 w-2/3 rounded-full bg-line" />
          <span className="my-1 h-2 w-full rounded-full bg-rose/45" />
          <span className="h-2 w-11/12 rounded-full bg-rose/45" />
          <span className="mt-1 h-2 w-3/4 rounded-full bg-line" />
          <span className="h-2 w-1/2 rounded-full bg-line" />
        </div>
        <p className="mt-4 text-[0.8125rem] text-ink-3">The highlighted lines are the ones it used.</p>
      </div>
    </div>
  );
}

const STUDENTS = ['Amara', 'Ben', 'Chidi', 'Dana', 'Eli', 'Fay'];
/* Deliberately uneven: a grid where everyone has met everything teaches nothing. */
const MASTERY = [
  { objective: 'Estimate slope from a table', met: [1, 1, 1, 1, 0.5, 1] },
  { objective: 'Define the derivative as a limit', met: [1, 1, 0.5, 1, 0, 1] },
  { objective: 'Apply the power rule', met: [1, 0.5, 0, 1, 0, 0.5] },
  { objective: 'Differentiate a polynomial', met: [0.5, 0, 0, 1, 0, 0] },
];

/** The payoff: who has met what, at a glance. */
export function MasteryGrid() {
  return (
    <div className="rail -mx-6 px-6 lg:mx-0 lg:px-0">
      <div className="min-w-[520px] rounded-[12px] border border-line-soft bg-surface p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_repeat(6,32px)] items-end gap-y-1">
          <span />
          {STUDENTS.map((name) => (
            <span key={name} className="pb-2 text-center text-[0.6875rem] text-ink-3">
              {name}
            </span>
          ))}

          {MASTERY.map((row) => (
            <Row key={row.objective} objective={row.objective} met={row.met} />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line-soft pt-4 text-[0.75rem] text-ink-3">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-[3px] bg-rose" /> Met
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-[3px] bg-rose/35" /> Getting there
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-[3px] border border-line" /> Not yet
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({ objective, met }: { objective: string; met: number[] }) {
  return (
    <>
      <span className="border-t border-line-soft py-2.5 pr-4 text-[0.8125rem]">{objective}</span>
      {met.map((value, i) => (
        <span key={i} className="grid place-items-center border-t border-line-soft py-2.5">
          <span
            className={
              value === 1
                ? 'h-4 w-4 rounded-[4px] bg-rose'
                : value === 0.5
                  ? 'h-4 w-4 rounded-[4px] bg-rose/35'
                  : 'h-4 w-4 rounded-[4px] border border-line'
            }
          />
        </span>
      ))}
    </>
  );
}

/** The student's whole experience, at phone size. */
export function JoinPhone() {
  return (
    <div className="mx-auto w-full max-w-[260px] rounded-[22px] border border-line bg-surface p-3 shadow-[0_24px_60px_-40px_rgba(25,28,43,0.8)]">
      <div className="rounded-[16px] bg-surface-2 p-4">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-3">
          Rates of change
        </p>
        <p className="mt-3 text-[1.0625rem] font-semibold leading-snug">What should we call you?</p>
        <div className="mt-4 rounded-[8px] border border-line bg-surface px-3 py-2.5 text-[0.875rem] text-ink-3">
          First name is fine
        </div>
        <div className="mt-3 grid min-h-11 place-items-center rounded-[8px] bg-rose text-[0.875rem] font-semibold text-on-rose">
          Start
        </div>
        <p className="mt-3 text-[0.75rem] text-ink-3">No account, no password.</p>
      </div>
    </div>
  );
}
