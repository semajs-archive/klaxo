import type { Metadata } from 'next';
import { Reveal } from '@/components/Reveal';
import { ProvenanceCard } from '@/components/showcase';
import { Band, ButtonLink, Card, SectionHead, Wrap } from '@/components/ui';
import { PageHero } from '@/components/PageHero';
import { START_HREF } from '@/lib/cn';

export const metadata: Metadata = {
  title: 'How it builds',
  description:
    'Four passes — read, order, write, check — and what you can edit after each one.',
};

const PASSES = [
  {
    title: 'Reads what you handed over',
    body: 'Syllabi, chapters, notes, slides, PDFs, a photograph of a page. Nothing has to be reformatted.',
    out: 'A list of what it found, and anything it could not read.',
  },
  {
    title: 'Lays out the order',
    body: 'Units, topics and measurable objectives. An objective is only placed once the things it depends on sit behind it.',
    out: 'An outline you can rearrange or cut before a word is written.',
  },
  {
    title: 'Writes against each objective',
    body: 'Explanation, worked examples, practice and assessment — aimed at one objective, not at the topic in general.',
    out: 'Lessons and question banks, each labelled with its objective.',
  },
  {
    title: 'Marks its own work',
    body: 'A separate pass looks for lessons that drift, questions that test something else, and claims the source does not support.',
    out: 'A record of what it flagged and what it rewrote, kept as a version.',
  },
];

export default function HowItBuildsPage() {
  return (
    <>
      <PageHero
        eyebrow="How it builds"
        title="Four passes, and you can read every one."
        lede="Nothing appears in one shot behind a spinner. Each pass produces something you can open and argue with."
      />

      <Band>
        <ol className="grid gap-4">
          {PASSES.map((pass, i) => (
            <Reveal as="li" key={pass.title} delay={i * 70}>
              <Card className="grid gap-4 sm:grid-cols-[auto_1fr] sm:gap-7">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-rose-line bg-rose-soft text-sm font-semibold tabular-nums text-rose">
                  {i + 1}
                </span>
                <div>
                  <h2 className="text-[1.1875rem] font-semibold tracking-[-0.02em]">{pass.title}</h2>
                  <p className="prose-voice mt-2.5 text-[1rem]">{pass.body}</p>
                  <p className="mt-4 border-t border-line-soft pt-4 text-[0.875rem] text-ink-3">
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
            eyebrow="The pass that matters"
            title="The check is a separate reader."
            lede="The model that audits the course is not the call that wrote it. That is what catches the confident mistakes."
          />
        </Reveal>
        <Reveal delay={100} className="mt-9">
          <ProvenanceCard />
        </Reveal>
      </Band>

      <section className="bg-band py-20 text-on-band sm:py-24">
        <Wrap>
          <Reveal>
            <h2 className="max-w-[16ch] text-[clamp(1.75rem,3.4vw,2.6rem)] font-bold leading-[1.06]">
              Run one unit through and see.
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={START_HREF} variant="on-band">
                Start a course — free
              </ButtonLink>
              <ButtonLink href="/what-you-get" variant="on-band-ghost">
                What you get back
              </ButtonLink>
            </div>
          </Reveal>
        </Wrap>
      </section>
    </>
  );
}
