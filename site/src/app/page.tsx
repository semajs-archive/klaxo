import { SpineDiagram } from '@/components/SpineDiagram';
import { Reveal } from '@/components/Reveal';
import { Band, ButtonLink, Card, Check, SectionHead, Wrap } from '@/components/ui';
import { appHref } from '@/lib/cn';

const FACTS = [
  { title: 'Free to use', body: 'No plan, no seat count, no trial clock.' },
  { title: 'Open source', body: 'The code is public and readable.' },
  { title: 'Self-hostable', body: 'Run it yourself with your own AI provider.' },
];

const PASSES = [
  {
    title: 'Read your material',
    body: 'Syllabi, textbook chapters, lecture notes, slides, PDFs, photographs of pages, or prose you type in.',
  },
  {
    title: 'Lay out the order',
    body: 'Units, topics and measurable objectives, sequenced so nothing leans on something the class has not met yet.',
  },
  {
    title: 'Write against it',
    body: 'Lessons, worked examples, practice questions and assessment items, each one written for a named objective.',
  },
  {
    title: 'Mark its own work',
    body: 'A separate quality pass finds the weak or mismatched pieces and rewrites only those.',
  },
];

const GETS = [
  'A unit-by-unit outline you can argue with before anything is written',
  'Objectives phrased so you can tell whether a student has met them',
  'Practice and assessment tied to a specific objective, not to a topic in general',
  'Every generated claim pointing back at the source it came from',
  'Mastery per objective, from real attempts rather than from completion',
  'One share link for students — no accounts to create or reset',
];

export default function HomePage() {
  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="pt-16 sm:pt-20">
        <Wrap>
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)]">
            <div>
              <Reveal>
                <h1 className="max-w-[15ch] text-[clamp(2.2rem,4.35vw,3.4rem)] font-bold leading-[1.04]">
                  The course you already teach, laid out in order.
                </h1>
              </Reveal>
              <Reveal delay={80}>
                <p className="prose-voice mt-6 max-w-[46ch] text-[1.125rem]">
                  Hand KLAXO your syllabus and your notes. Get back units, objectives, lessons and
                  practice in a sequence that holds — with the source behind every line still
                  attached to it.
                </p>
              </Reveal>
              <Reveal delay={160}>
                <div className="mt-8 flex flex-wrap gap-3">
                  <ButtonLink href={appHref('/login?mode=signup')}>Open KLAXO</ButtonLink>
                  <ButtonLink href="/how-it-builds" variant="ghost">
                    See how it builds
                  </ButtonLink>
                </div>
              </Reveal>
            </div>

            <Reveal delay={220}>
              <SpineDiagram />
            </Reveal>
          </div>
        </Wrap>
      </section>

      {/* ----------------------------------------------------------- facts */}
      <Wrap>
        <Reveal className="mt-20 border-y border-line">
          <div className="grid sm:grid-cols-3">
            {FACTS.map((fact, i) => (
              <div
                key={fact.title}
                className={`px-0 py-7 sm:px-[30px] ${i === 0 ? 'sm:pl-0' : 'sm:border-l sm:border-line'}`}
              >
                <b className="block text-[1.0625rem] tracking-[-0.02em]">{fact.title}</b>
                <span className="text-[0.9375rem] text-ink-3">{fact.body}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </Wrap>

      {/* ---------------------------------------------------------- passes */}
      <Band>
        <Reveal>
          <SectionHead
            eyebrow="How it builds"
            title="Four passes, in that order."
            lede="KLAXO reads before it writes, and it writes before it judges. Each pass has one job, and you can stop and edit after any of them."
          />
        </Reveal>

        <ol className="relative mt-11 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {/* the spine the steps hang from */}
          <span aria-hidden="true" className="absolute left-0 right-0 top-[13px] hidden h-px bg-line lg:block" />
          {PASSES.map((pass, i) => (
            <Reveal as="li" key={pass.title} delay={i * 90} className="relative lg:pr-7">
              <span
                className={`relative z-10 grid h-[26px] w-[26px] place-items-center rounded-full border text-xs font-semibold tabular-nums ${
                  i === 0 ? 'border-rose bg-rose text-white' : 'border-line bg-paper text-ink-2'
                }`}
              >
                {i + 1}
              </span>
              <h3 className="mt-5 text-[1.1875rem] font-semibold leading-tight tracking-[-0.018em]">
                {pass.title}
              </h3>
              <p className="mt-2.5 text-[0.9375rem] text-ink-2">{pass.body}</p>
            </Reveal>
          ))}
        </ol>
      </Band>

      {/* ------------------------------------------------------------ gets */}
      <Band deep>
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <Reveal>
            <SectionHead
              eyebrow="What you get"
              title="What lands on the other side."
              lede="Not a wall of generated text. A course with an order, a reason for that order, and a way to see who has actually met each objective."
            />
            <div className="mt-8">
              <ButtonLink href="/what-you-get" variant="ghost">
                See it in detail
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <ul className="grid gap-0">
              {GETS.map((item) => (
                <li key={item} className="flex gap-3.5 border-b border-line py-4 last:border-0">
                  <Check className="mt-0.5" />
                  <span className="text-[0.9375rem] text-ink-2">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Band>

      {/* --------------------------------------------------------- sharing */}
      <Band>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <SectionHead
              eyebrow="Students"
              title="One link. No accounts."
              lede="Turn on sharing and you get a link to hand out. A student opens it, types a name, and starts working. Nothing to install, nothing to reset."
            />
            <div className="mt-8">
              <ButtonLink href="/students" variant="ghost">
                How sharing works
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <Card className="p-0">
              <div className="flex items-center gap-3 border-b border-line-soft px-5 py-4">
                <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-3">
                  Share link
                </span>
                <span className="ml-auto truncate rounded-[6px] bg-surface-2 px-2.5 py-1 text-xs text-ink-2">
                  /learn/9f3c-a1d7
                </span>
              </div>
              <div className="grid gap-3 px-5 py-5">
                {['Works on a school Chromebook or a phone', 'Their progress stays attached to the course', 'Revoke the link and it stops working'].map(
                  (line) => (
                    <div key={line} className="flex gap-3">
                      <Check className="mt-0.5" />
                      <span className="text-[0.9375rem] text-ink-2">{line}</span>
                    </div>
                  ),
                )}
              </div>
            </Card>
          </Reveal>
        </div>
      </Band>

      {/* ------------------------------------------------------- ink close */}
      <section className="bg-ink py-20 text-on-ink sm:py-24">
        <Wrap>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <Reveal>
              <h2 className="max-w-[13ch] text-[clamp(1.85rem,3.4vw,2.85rem)] font-bold leading-[1.06]">
                Put one unit through it and judge for yourself.
              </h2>
              <p className="prose-voice mt-5 text-on-ink-2">
                There is nothing to weigh up first. Take a unit you know well, hand over the
                material, and read what comes back.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href={appHref('/login?mode=signup')} variant="on-ink">
                  Open KLAXO
                </ButtonLink>
                <ButtonLink href="/free-and-open" variant="on-ink-ghost">
                  What it costs
                </ButtonLink>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <ul className="grid">
                {[
                  { k: 'Cost', v: 'Free, with no plan to upgrade to' },
                  { k: 'Code', v: 'Public, and you can host it yourself' },
                  { k: 'AI', v: 'Bring your own provider if you self-host' },
                ].map((row) => (
                  <li key={row.k} className="border-t border-on-ink-line py-4 last:border-b">
                    <b className="block text-[1.0625rem] font-semibold tracking-[-0.02em]">{row.k}</b>
                    <span className="text-[0.9375rem] text-on-ink-3">{row.v}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </Wrap>
      </section>
    </>
  );
}
