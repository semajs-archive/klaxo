import type { Metadata } from 'next';
import { Reveal } from '@/components/Reveal';
import { Band, ButtonLink, Check, SectionHead, Wrap } from '@/components/ui';
import { PageHero } from '@/components/PageHero';
import { START_HREF } from '@/lib/cn';

export const metadata: Metadata = {
  title: 'What it costs',
  description: 'Free while KLAXO is in beta. No card, no seat count, no trial clock.',
};

const INCLUDED = [
  'As many courses as you want to build',
  'No account, no login, nothing to set up',
  'Mastery tracked per objective',
  'Every version of every course kept',
];

const QUESTIONS = [
  {
    q: 'Free for how long?',
    a: 'For as long as it is in beta. When that changes you will hear it from us before it happens, not from a locked screen.',
  },
  {
    q: 'What happens to what I built?',
    a: 'It stays yours. Anything you make now remains available to you, and you can take it with you.',
  },
  {
    q: 'Do I need a card?',
    a: 'No. There is nothing to enter and no trial to run out.',
  },
];

export default function WhatItCostsPage() {
  return (
    <>
      <PageHero
        eyebrow="What it costs"
        title="Nothing, while it is in beta."
        lede="No card, no seat count, no clock running down. That is the whole answer."
      />

      <Band>
        <Reveal>
          <div className="mx-auto max-w-[560px] rounded-[12px] border border-rose-line bg-surface p-8 text-center sm:p-10">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-rose">
              Everything, right now
            </p>
            <p className="mt-4 text-[3.5rem] font-bold leading-none tracking-[-0.04em]">Free</p>
            <ul className="mt-8 grid gap-3.5 text-left">
              {INCLUDED.map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-0.5" />
                  <span className="text-[0.9375rem] text-ink-2">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <ButtonLink href={START_HREF} className="w-full">
                Start studying
              </ButtonLink>
              <p className="mt-3 text-[0.8125rem] text-ink-3">
                No sign-up, no login.
              </p>
            </div>
          </div>
        </Reveal>
      </Band>

      <Band deep>
        <Reveal>
          <SectionHead eyebrow="Questions" title="Free, specifically how?" />
        </Reveal>
        <dl className="mt-9 grid gap-0 overflow-hidden rounded-[12px] border border-line-soft bg-surface">
          {QUESTIONS.map((item, i) => (
            <Reveal key={item.q} delay={i * 60}>
              <div className="border-b border-line-soft p-6 last:border-0 sm:p-7">
                <dt className="text-[1.0625rem] font-semibold tracking-[-0.018em]">{item.q}</dt>
                <dd className="prose-voice mt-2.5 text-[1rem]">{item.a}</dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </Band>

      <section className="bg-band py-20 text-on-band sm:py-24">
        <Wrap>
          <Reveal>
            <h2 className="max-w-[15ch] text-[clamp(1.75rem,3.4vw,2.6rem)] font-bold leading-[1.06]">
              Nothing to weigh up. Start one.
            </h2>
            <div className="mt-8">
              <ButtonLink href={START_HREF} variant="on-band">
                Start studying
              </ButtonLink>
            </div>
          </Reveal>
        </Wrap>
      </section>
    </>
  );
}
