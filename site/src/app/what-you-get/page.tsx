import type { Metadata } from 'next';
import { Reveal } from '@/components/Reveal';
import { BeforeAfter, MasteryGrid } from '@/components/showcase';
import { Band, ButtonLink, Card, SectionHead, Wrap } from '@/components/ui';
import { PageHero } from '@/components/PageHero';
import { START_HREF } from '@/lib/cn';

export const metadata: Metadata = {
  title: 'What you get',
  description:
    'An outline you can argue with, objectives you can mark, practice that matches, and every line traceable to its source.',
};

const PARTS = [
  {
    title: 'An outline first',
    body: 'Units, topics and objectives in dependency order, before any prose exists.',
  },
  {
    title: 'Objectives you can mark',
    body: 'Phrased as something a student does, so "met" is a fact rather than a feeling.',
  },
  {
    title: 'Lessons aimed at one thing',
    body: 'Each written for a named objective, not as an essay about the topic.',
  },
  {
    title: 'Practice that matches',
    body: 'A wrong answer tells you which objective is missing, not just that a score dropped.',
  },
  {
    title: 'A source on every claim',
    body: 'Checking is reading, not guessing.',
  },
  {
    title: 'Versions you can go back to',
    body: 'The check records what it flagged and rewrote. Nothing is overwritten silently.',
  },
];

export default function WhatYouGetPage() {
  return (
    <>
      <PageHero
        eyebrow="What you get"
        title="A course with an order, and a reason for that order."
        lede="The things you would otherwise have built yourself, over a term of evenings."
      />

      <Band>
        <Reveal>
          <BeforeAfter />
        </Reveal>
      </Band>

      <Band deep>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PARTS.map((part, i) => (
            <Reveal key={part.title} delay={(i % 3) * 80}>
              <Card className="h-full">
                <h2 className="text-[1.0625rem] font-semibold tracking-[-0.018em]">{part.title}</h2>
                <p className="mt-2 text-[0.9375rem] text-ink-2">{part.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Band>

      <Band>
        <Reveal>
          <SectionHead
            eyebrow="Afterwards"
            title="Coverage is not learning."
            lede="Mastery is tracked per objective, from real attempts, so a gap is a specific thing you can reteach."
          />
        </Reveal>
        <Reveal delay={100} className="mt-9">
          <MasteryGrid />
        </Reveal>
      </Band>

      <Band deep>
        <Reveal>
          <SectionHead
            eyebrow="Honestly"
            title="What it does not do."
            lede="It does not know your class, and it will sometimes order something in a way you disagree with. That is why every stage is editable before the next one runs."
          />
        </Reveal>
      </Band>

      <section className="bg-band py-20 text-on-band sm:py-24">
        <Wrap>
          <Reveal>
            <h2 className="max-w-[17ch] text-[clamp(1.75rem,3.4vw,2.6rem)] font-bold leading-[1.06]">
              Compare it with what you would have written.
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={START_HREF} variant="on-band">
                Start studying
              </ButtonLink>
              <ButtonLink href="/students" variant="on-band-ghost">
                Sharing with a class
              </ButtonLink>
            </div>
          </Reveal>
        </Wrap>
      </section>
    </>
  );
}
