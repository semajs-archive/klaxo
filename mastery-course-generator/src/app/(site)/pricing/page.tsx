import type { Metadata } from 'next';
import Link from 'next/link';
import { CTABand, FaqList, PageHero, SectionHeading } from '@/components/site/blocks';

export const metadata: Metadata = {
  title: 'Pricing — KLAXO',
  description:
    'KLAXO is free and open source. Run the hosted version, or host it yourself and bring your own AI provider.',
};

const options = [
  {
    name: 'Hosted',
    price: 'Free',
    blurb: 'Sign up and build courses. Nothing to install.',
    points: [
      'Unlimited courses on your account',
      'Share links for students, no student accounts',
      'Mastery tracking per objective',
      'Generation speed depends on the AI allowance this instance runs on',
    ],
    cta: { href: '/login?mode=signup', label: 'Create an account' },
    featured: true,
  },
  {
    name: 'Self-hosted',
    price: 'Free',
    blurb: 'Your server, your database, your AI provider and its bill.',
    points: [
      'Everything in the hosted version',
      'Your own AI provider key and model choice',
      'Course data stays on hardware you control',
      'Runs from a single container with a SQLite volume',
    ],
    cta: { href: 'https://github.com/semajs-archive/klaxo', label: 'Read the setup guide' },
    featured: false,
  },
];

const faqs = [
  {
    q: 'What is the catch?',
    a: 'There is not one. KLAXO is a project, not a company, and the code is public. The real cost is AI usage, and KLAXO is built to run on providers with a free daily allowance so that cost can stay at zero.',
  },
  {
    q: 'What happens if the AI allowance runs out?',
    a: 'Generation queues and picks up again once there is room. Nothing you have already built is lost, because every stage is saved as it completes.',
  },
  {
    q: 'Will there be paid plans later?',
    a: 'Nothing is planned. If hosting costs ever make one necessary, self-hosting stays free and fully featured.',
  },
];

export default function PricingPage() {
  return (
    <div className="space-y-16">
      <PageHero
        kicker="Pricing"
        title="It is free, and the code is"
        highlight="open."
        lede="KLAXO was built because good curriculum tooling should not be priced per educator. Use the hosted version, or run your own copy and plug in whichever AI provider you want."
      />

      <section className="grid gap-6 lg:grid-cols-2">
        {options.map((option) => (
          <div
            key={option.name}
            className={`flex flex-col rounded-2xl border-[1.5px] border-ink p-7 shadow-pop sm:p-8 ${
              option.featured ? 'bg-brand-surface' : 'bg-card'
            }`}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {option.name}
            </p>
            <p className="mt-3 font-display text-5xl font-extrabold">{option.price}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{option.blurb}</p>
            <ul className="mt-6 flex-1 space-y-3">
              {option.points.map((point) => (
                <li key={point} className="flex gap-3 text-sm leading-6">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-1 h-4 w-4 shrink-0 text-success"
                    aria-hidden="true"
                  >
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <Link
              href={option.cta.href}
              className={`mt-8 inline-flex h-12 items-center justify-center rounded-xl border-[1.5px] border-ink px-8 font-display text-base font-bold shadow-pop transition-all active:translate-y-[3px] active:shadow-none ${
                option.featured
                  ? 'bg-primary text-primary-foreground hover:bg-primary-500'
                  : 'bg-card hover:bg-secondary'
              }`}
            >
              {option.cta.label}
            </Link>
          </div>
        ))}
      </section>

      <section>
        <SectionHeading kicker="Questions" title="Free, specifically how?" />
        <FaqList items={faqs} />
      </section>

      <CTABand
        title="Nothing to weigh up. Just make an account."
        body="You can build a full course before deciding whether it is worth using with a class."
      />
    </div>
  );
}
