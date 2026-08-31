import type { Metadata } from 'next';
import { Reveal } from '@/components/Reveal';
import { Band, ButtonLink, Card, Check, SectionHead, Wrap } from '@/components/ui';
import { PageHero } from '@/components/PageHero';
import { appHref } from '@/lib/cn';

export const metadata: Metadata = {
  title: 'Students',
  description:
    'Students join a KLAXO course through one share link. No accounts, no passwords, no install.',
};

const STEPS = [
  { n: '01', title: 'You turn sharing on', body: 'A course gets a link. Nothing else changes.' },
  { n: '02', title: 'You hand out the link', body: 'Posted, printed, in a message — however your class already gets things.' },
  { n: '03', title: 'They type a name', body: 'That is the whole sign-up. No email, no password, no verification.' },
  { n: '04', title: 'They start working', body: 'Lessons and practice, in the order you approved.' },
];

const POINTS = [
  'No student accounts to create, chase or reset',
  'Works on a school Chromebook, a shared machine, or a phone',
  'Their progress stays attached to the course, not to a login',
  'Revoke the link whenever you want and it stops working',
  'You see mastery per objective across everyone who joined',
];

export default function StudentsPage() {
  return (
    <>
      <PageHero
        eyebrow="Students"
        title="One link, and they are in."
        lede="The fastest way to lose a class is to make thirty people create accounts. KLAXO does not ask them to. Only the person building the course signs up."
      />

      <Band>
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <Reveal as="li" key={step.n} delay={i * 80}>
              <Card className="h-full">
                <span className="text-[0.8125rem] font-semibold tabular-nums text-rose">{step.n}</span>
                <h2 className="mt-4 text-[1.1875rem] font-semibold tracking-[-0.018em]">{step.title}</h2>
                <p className="mt-2.5 text-[0.9375rem] text-ink-2">{step.body}</p>
              </Card>
            </Reveal>
          ))}
        </ol>
      </Band>

      <Band deep>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <SectionHead
              eyebrow="What that buys you"
              title="Nothing between the class and the work."
            />
            <ul className="mt-8 grid">
              {POINTS.map((point) => (
                <li key={point} className="flex gap-3.5 border-b border-line py-4 last:border-0">
                  <Check className="mt-0.5" />
                  <span className="text-[0.9375rem] text-ink-2">{point}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120}>
            <Card className="p-0">
              <div className="border-b border-line-soft px-6 py-5">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-3">
                  What a student sees
                </p>
              </div>
              <div className="grid gap-4 px-6 py-6">
                <div className="rounded-[8px] border border-line-soft bg-surface-2 px-4 py-3">
                  <p className="text-[0.8125rem] text-ink-3">Rates of change — Unit 2</p>
                  <p className="mt-1 text-[0.9375rem] font-semibold">What should we call you?</p>
                </div>
                <div className="rounded-[8px] border border-line-soft px-4 py-3 text-[0.9375rem] text-ink-3">
                  First name is fine
                </div>
                <div className="inline-flex min-h-11 items-center justify-center rounded-[8px] bg-rose px-5 text-[0.9375rem] font-semibold text-white">
                  Start
                </div>
                <p className="text-[0.8125rem] text-ink-3">
                  That is the entire flow. No password to forget before the lesson starts.
                </p>
              </div>
            </Card>
          </Reveal>
        </div>
      </Band>

      <section className="bg-ink py-20 text-on-ink sm:py-24">
        <Wrap>
          <Reveal>
            <h2 className="max-w-[16ch] text-[clamp(1.85rem,3.4vw,2.6rem)] font-bold leading-[1.06]">
              Build one course, then hand out the link.
            </h2>
            <p className="prose-voice mt-5 text-on-ink-2">
              You can have something a class can open before the end of a free period.
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
        </Wrap>
      </section>
    </>
  );
}
