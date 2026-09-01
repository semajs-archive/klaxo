import type { Metadata } from 'next';
import { Reveal } from '@/components/Reveal';
import { JoinPhone, MasteryGrid } from '@/components/showcase';
import { Band, ButtonLink, Card, Check, SectionHead, Wrap } from '@/components/ui';
import { PageHero } from '@/components/PageHero';
import { START_HREF } from '@/lib/cn';

export const metadata: Metadata = {
  title: 'Students',
  description: 'Students join through one link. No accounts, no passwords, nothing to install.',
};

const STEPS = [
  { n: '01', title: 'Turn sharing on', body: 'The course gets a link.' },
  { n: '02', title: 'Hand it out', body: 'However your class already gets things.' },
  { n: '03', title: 'They type a name', body: 'That is the whole sign-up.' },
  { n: '04', title: 'They start', body: 'In the order you approved.' },
];

const POINTS = [
  'No accounts to create, chase or reset',
  'Works on a school Chromebook or a phone',
  'Progress stays with the course, not a login',
  'Revoke the link and it stops working',
];

export default function StudentsPage() {
  return (
    <>
      <PageHero
        eyebrow="Students"
        title="One link, and they are in."
        lede="Hand out a link and they type a name. Nobody creates an account, including you."
      />

      <Band>
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <ol className="grid gap-4 sm:grid-cols-2">
            {STEPS.map((step, i) => (
              <Reveal as="li" key={step.n} delay={i * 70}>
                <Card className="h-full">
                  <span className="text-[0.8125rem] font-semibold tabular-nums text-rose">{step.n}</span>
                  <h2 className="mt-3 text-[1.0625rem] font-semibold tracking-[-0.018em]">{step.title}</h2>
                  <p className="mt-1.5 text-[0.9375rem] text-ink-2">{step.body}</p>
                </Card>
              </Reveal>
            ))}
          </ol>
          <Reveal delay={140}>
            <JoinPhone />
          </Reveal>
        </div>
      </Band>

      <Band deep>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <SectionHead eyebrow="What that buys you" title="Nothing between the class and the work." />
            <ul className="mt-7 grid">
              {POINTS.map((point) => (
                <li key={point} className="flex gap-3.5 border-b border-line py-3.5 last:border-0">
                  <Check className="mt-0.5" />
                  <span className="text-[0.9375rem] text-ink-2">{point}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <MasteryGrid />
          </Reveal>
        </div>
      </Band>

      <section className="bg-band py-20 text-on-band sm:py-24">
        <Wrap>
          <Reveal>
            <h2 className="max-w-[16ch] text-[clamp(1.75rem,3.4vw,2.6rem)] font-bold leading-[1.06]">
              Build one course, then hand out the link.
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={START_HREF} variant="on-band">
                Start studying
              </ButtonLink>
              <ButtonLink href="/what-it-costs" variant="on-band-ghost">
                What it costs
              </ButtonLink>
            </div>
          </Reveal>
        </Wrap>
      </section>
    </>
  );
}
