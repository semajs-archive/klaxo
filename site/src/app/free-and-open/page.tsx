import type { Metadata } from 'next';
import { Reveal } from '@/components/Reveal';
import { Band, ButtonLink, Card, Check, SectionHead, Wrap } from '@/components/ui';
import { PageHero } from '@/components/PageHero';
import { appHref } from '@/lib/cn';

export const metadata: Metadata = {
  title: 'Free and open',
  description:
    'KLAXO is free to use and open source. Use the hosted version, or run your own copy with your own AI provider.',
};

const REPO = 'https://github.com/semajs-archive/klaxo';

const OPTIONS = [
  {
    name: 'Hosted',
    price: 'Free',
    blurb: 'Make an account and start building. Nothing to install.',
    points: [
      'As many courses as you want',
      'Share links for students, with no student accounts',
      'Mastery tracked per objective',
      'Generation speed depends on the AI allowance the instance runs on',
    ],
    cta: { href: appHref('/login?mode=signup'), label: 'Open KLAXO' },
    featured: true,
  },
  {
    name: 'Self-hosted',
    price: 'Free',
    blurb: 'Your server, your database, your AI provider and its bill.',
    points: [
      'Everything the hosted version does',
      'Your own AI provider key and choice of model',
      'Course material stays on hardware you control',
      'Runs from a single container with a SQLite volume',
    ],
    cta: { href: REPO, label: 'Read the setup guide' },
    featured: false,
  },
];

const QUESTIONS = [
  {
    q: 'What is the catch?',
    a: 'There is not one. KLAXO is a project rather than a company, and the code is public. The real cost of running it is AI usage, and it is built to run on providers with a free daily allowance so that cost can stay at zero.',
  },
  {
    q: 'What happens if the AI allowance runs out?',
    a: 'Generation queues and picks up again when there is room. Nothing already built is lost, because each pass is saved as it finishes.',
  },
  {
    q: 'Will there be paid plans later?',
    a: 'Nothing is planned. If hosting ever forces the question, self-hosting stays free and complete.',
  },
  {
    q: 'Where does my material go?',
    a: 'It is stored with your course on the server running KLAXO, and the text is sent to whichever AI provider that install is configured with in order to build the course. What that provider does with it is governed by their own terms — so a school that needs a specific answer can self-host and choose the provider.',
  },
];

export default function FreeAndOpenPage() {
  return (
    <>
      <PageHero
        eyebrow="Free and open"
        title="It costs nothing, and you can read the code."
        lede="Curriculum tooling should not be priced per teacher. Use the hosted version, or run your own copy and point it at whichever AI provider you want."
      />

      <Band>
        <div className="grid gap-6 lg:grid-cols-2">
          {OPTIONS.map((option, i) => (
            <Reveal key={option.name} delay={i * 90}>
              <Card
                className={`flex h-full flex-col ${
                  option.featured ? 'border-rose-line bg-rose-soft/40' : ''
                }`}
              >
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink-3">
                  {option.name}
                </p>
                <p className="mt-3 text-[3rem] font-bold leading-none tracking-[-0.035em]">
                  {option.price}
                </p>
                <p className="mt-3 text-[0.9375rem] text-ink-2">{option.blurb}</p>
                <ul className="mt-7 flex-1 grid gap-3.5">
                  {option.points.map((point) => (
                    <li key={point} className="flex gap-3">
                      <Check className="mt-0.5" />
                      <span className="text-[0.9375rem] text-ink-2">{point}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <ButtonLink
                    href={option.cta.href}
                    variant={option.featured ? 'primary' : 'ghost'}
                    className="w-full"
                  >
                    {option.cta.label}
                  </ButtonLink>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </Band>

      <Band deep>
        <Reveal>
          <SectionHead eyebrow="Questions" title="Free, specifically how?" />
        </Reveal>
        <dl className="mt-10 grid gap-0 overflow-hidden rounded-[12px] border border-line-soft bg-surface">
          {QUESTIONS.map((item, i) => (
            <Reveal key={item.q} delay={i * 60}>
              <div className="border-b border-line-soft p-7 last:border-0">
                <dt className="text-[1.1875rem] font-semibold tracking-[-0.018em]">{item.q}</dt>
                <dd className="prose-voice mt-3">{item.a}</dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </Band>

      <section className="bg-ink py-20 text-on-ink sm:py-24">
        <Wrap>
          <Reveal>
            <h2 className="max-w-[15ch] text-[clamp(1.85rem,3.4vw,2.6rem)] font-bold leading-[1.06]">
              Nothing to weigh up. Just make an account.
            </h2>
            <p className="prose-voice mt-5 text-on-ink-2">
              You can build a full course before deciding whether it is worth using with a class.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={appHref('/login?mode=signup')} variant="on-ink">
                Open KLAXO
              </ButtonLink>
              <ButtonLink href={REPO} variant="on-ink-ghost">
                Read the source
              </ButtonLink>
            </div>
          </Reveal>
        </Wrap>
      </section>
    </>
  );
}
