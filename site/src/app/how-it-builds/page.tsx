import type { Metadata } from 'next';
import { Reveal } from '@/components/Reveal';
import { Band, ButtonLink, Card, SectionHead, Wrap } from '@/components/ui';
import { PageHero } from '@/components/PageHero';
import { appHref } from '@/lib/cn';

export const metadata: Metadata = {
  title: 'How it builds',
  description:
    'The four passes KLAXO runs over your material — read, order, write, check — and what you can edit after each one.',
};

const PASSES = [
  {
    title: 'It reads what you handed over',
    body: 'Syllabi, textbook chapters, lecture notes, slide decks, PDFs, photographs of a page, or prose you type straight in. Nothing has to be reformatted first, and there is no curriculum template to fill in.',
    out: 'A list of what it found, and what it could not read.',
  },
  {
    title: 'It lays out the order',
    body: 'The material becomes units, topics and measurable objectives. The order is the work: an objective is only placed once the things it depends on are already behind it.',
    out: 'An outline you can rearrange, rename or delete before a word is written.',
  },
  {
    title: 'It writes against the objectives',
    body: 'Each objective gets its own explanation, worked examples, practice questions and assessment items — written for that objective rather than for the topic in general.',
    out: 'Lessons and question banks, each one labelled with the objective it serves.',
  },
  {
    title: 'It marks its own work',
    body: 'A separate pass reads the course back and looks for the weak parts: a lesson that drifts off its objective, a question that tests something else, a claim the source does not support. Only what fails gets rewritten.',
    out: 'A list of what it flagged and what it changed, kept as a version.',
  },
];

const PROPERTIES = [
  {
    title: 'It saves as it goes',
    body: 'Each pass is stored when it completes, so a dropped connection or an exhausted AI allowance costs you the current step, never the course.',
  },
  {
    title: 'It shows its sources',
    body: 'Generated material stays tied to the material it came from, so you can check a claim instead of trusting it.',
  },
  {
    title: 'It revises narrowly',
    body: 'A flagged lesson is rewritten on its own. The rest of the course is left exactly as you approved it.',
  },
];

export default function HowItBuildsPage() {
  return (
    <>
      <PageHero
        eyebrow="How it builds"
        title="Four passes, and you can read every one of them."
        lede="Nothing is produced in a single shot behind a spinner. Each pass has one job, produces something you can open and argue with, and hands the next pass a course rather than a prompt."
      />

      <Band>
        <ol className="grid gap-5">
          {PASSES.map((pass, i) => (
            <Reveal as="li" key={pass.title} delay={i * 70}>
              <Card className="grid gap-5 sm:grid-cols-[auto_1fr] sm:gap-8">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-rose-line bg-rose-soft text-sm font-semibold tabular-nums text-rose-deep">
                  {i + 1}
                </span>
                <div>
                  <h2 className="text-[1.3125rem] font-semibold tracking-[-0.02em]">{pass.title}</h2>
                  <p className="prose-voice mt-3">{pass.body}</p>
                  <p className="mt-4 border-t border-line-soft pt-4 text-[0.9375rem] text-ink-3">
                    <span className="font-semibold text-ink-2">You end up with: </span>
                    {pass.out}
                  </p>
                </div>
              </Card>
            </Reveal>
          ))}
        </ol>
      </Band>

      <Band deep>
        <Reveal>
          <SectionHead
            eyebrow="Why it is built this way"
            title="Three properties that matter more than speed."
          />
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PROPERTIES.map((property, i) => (
            <Reveal key={property.title} delay={i * 90}>
              <Card className="h-full">
                <h3 className="text-[1.1875rem] font-semibold tracking-[-0.018em]">{property.title}</h3>
                <p className="mt-2.5 text-[0.9375rem] text-ink-2">{property.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Band>

      <section className="bg-ink py-20 text-on-ink sm:py-24">
        <Wrap>
          <Reveal>
            <h2 className="max-w-[16ch] text-[clamp(1.85rem,3.4vw,2.6rem)] font-bold leading-[1.06]">
              The fastest way to judge it is to run one unit through.
            </h2>
            <p className="prose-voice mt-5 text-on-ink-2">
              Pick a unit you know well. If the order it produces is wrong, you will see it in a
              minute — and that is a fair test.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={appHref('/login?mode=signup')} variant="on-ink">
                Open KLAXO
              </ButtonLink>
              <ButtonLink href="/what-you-get" variant="on-ink-ghost">
                What you get back
              </ButtonLink>
            </div>
          </Reveal>
        </Wrap>
      </section>
    </>
  );
}
