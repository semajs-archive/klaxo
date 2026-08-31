import type { Metadata } from 'next';
import { Reveal } from '@/components/Reveal';
import { Band, ButtonLink, Card, Check, SectionHead, Wrap } from '@/components/ui';
import { PageHero } from '@/components/PageHero';
import { appHref } from '@/lib/cn';

export const metadata: Metadata = {
  title: 'What you get',
  description:
    'The outline, the objectives, the practice and assessment, the provenance, and mastery tracked per objective.',
};

const PARTS = [
  {
    title: 'An outline before any prose',
    body: 'Units and topics with measurable objectives under them, in a dependency order. You can rearrange, rename or cut before a single lesson is written.',
  },
  {
    title: 'Objectives you can actually mark',
    body: 'Phrased as something a student does — estimate, define, apply — so you can tell whether it has been met rather than whether it has been covered.',
  },
  {
    title: 'Lessons written to an objective',
    body: 'Explanation and worked examples aimed at one named objective, not a general essay about the topic.',
  },
  {
    title: 'Practice and assessment that match',
    body: 'Question banks generated per objective, so a wrong answer tells you which objective is missing rather than just lowering a score.',
  },
  {
    title: 'Provenance on every claim',
    body: 'What the model wrote stays attached to the material it came from, so checking is reading rather than guessing.',
  },
  {
    title: 'Versions you can go back to',
    body: 'The quality pass records what it flagged and what it rewrote. Nothing is overwritten silently.',
  },
];

const MASTERY = [
  'Progress is per objective, not per lesson opened',
  'It comes from real practice attempts',
  'A gap shows up as a specific objective you can reteach',
  'Objectives come back around for review as they go cold',
];

export default function WhatYouGetPage() {
  return (
    <>
      <PageHero
        eyebrow="What you get"
        title="A course with an order, and a reason for that order."
        lede="The output is not a document dump. It is the set of things you would have had to build yourself: the sequence, the objectives, the practice that matches them, and a way to see who has met what."
      />

      <Band>
        <div className="grid gap-5 md:grid-cols-2">
          {PARTS.map((part, i) => (
            <Reveal key={part.title} delay={(i % 2) * 80}>
              <Card className="h-full">
                <h2 className="text-[1.1875rem] font-semibold tracking-[-0.018em]">{part.title}</h2>
                <p className="mt-2.5 text-[0.9375rem] text-ink-2">{part.body}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Band>

      <Band deep>
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <Reveal>
            <SectionHead
              eyebrow="Mastery"
              title="Coverage is not the same as learning."
              lede="A course that mentions everything once is easy to generate and hard to learn from. KLAXO measures the thing you actually care about: whether a given objective has been met."
            />
          </Reveal>
          <Reveal delay={120}>
            <ul className="grid">
              {MASTERY.map((line) => (
                <li key={line} className="flex gap-3.5 border-b border-line py-4 last:border-0">
                  <Check className="mt-0.5" />
                  <span className="text-[0.9375rem] text-ink-2">{line}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Band>

      <Band>
        <Reveal>
          <SectionHead
            eyebrow="Honestly"
            title="What it does not do."
            lede="It does not know your class, it does not replace your judgement about what matters, and it will occasionally order something in a way you disagree with. That is why every stage is editable before the next one runs."
          />
        </Reveal>
      </Band>

      <section className="bg-ink py-20 text-on-ink sm:py-24">
        <Wrap>
          <Reveal>
            <h2 className="max-w-[17ch] text-[clamp(1.85rem,3.4vw,2.6rem)] font-bold leading-[1.06]">
              Compare it with what you would have written.
            </h2>
            <p className="prose-voice mt-5 text-on-ink-2">
              That is the only test worth running: take a unit you have already taught and see how
              close the outline lands.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={appHref('/login?mode=signup')} variant="on-ink">
                Open KLAXO
              </ButtonLink>
              <ButtonLink href="/students" variant="on-ink-ghost">
                Sharing with a class
              </ButtonLink>
            </div>
          </Reveal>
        </Wrap>
      </section>
    </>
  );
}
