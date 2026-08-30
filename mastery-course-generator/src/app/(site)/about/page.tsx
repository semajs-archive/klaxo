import type { Metadata } from 'next';
import Link from 'next/link';
import { CTABand, PageHero, SectionHeading } from '@/components/site/blocks';

export const metadata: Metadata = {
  title: 'About — KLAXO',
  description: 'Why KLAXO exists, what it believes about course design, and how it is built.',
};

const beliefs = [
  {
    title: 'Coverage is not learning',
    body: 'A course that mentions everything once is easy to generate and hard to learn from. KLAXO organises around objectives a learner can actually be shown to have met.',
  },
  {
    title: 'Generated work needs evidence',
    body: 'Anything the model writes is tied back to the source material it came from, so an educator can check it rather than take it on faith.',
  },
  {
    title: 'A wrong course should be fixable',
    body: 'QA finds the weak parts and revision rewrites only those, instead of regenerating the whole thing and hoping it lands better.',
  },
  {
    title: 'Cost should not gate teaching',
    body: 'The whole pipeline is designed to run on free AI allowances and cheap hosting, because the people who need it most have no budget line for software.',
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-16">
      <PageHero
        kicker="About"
        title="A curriculum tool that takes teaching"
        highlight="seriously."
        lede="KLAXO started from a simple frustration: AI can produce a plausible-looking course in seconds, and a plausible-looking course is worse than none, because someone has to teach from it."
      />

      <section>
        <SectionHeading
          kicker="What it is built on"
          title="Four opinions, baked into the pipeline."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {beliefs.map((belief) => (
            <div key={belief.title} className="rounded-2xl border-[1.5px] border-ink bg-card p-6 shadow-pop">
              <h3 className="font-display text-lg font-bold">{belief.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{belief.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 rounded-2xl border-[1.5px] border-ink bg-card p-7 shadow-pop lg:grid-cols-[1.2fr_.8fr] lg:p-10">
        <div>
          <p className="kicker">Under the hood</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold">Small, boring, portable.</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            KLAXO is a Next.js application with a SQLite database on a persistent volume and a
            background worker that runs generation jobs. It talks to AI providers over the
            standard OpenAI-style protocol, so swapping the model behind it is a change to a
            configuration file, not to the code. The whole thing runs in one container.
          </p>
          <Link
            href="https://github.com/semajs-archive/klaxo"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border-[1.5px] border-ink bg-card px-6 font-display text-sm font-bold shadow-pop transition-all hover:bg-secondary active:translate-y-[3px] active:shadow-none"
          >
            Read the source
          </Link>
        </div>
        <dl className="space-y-4">
          {[
            { k: 'App', v: 'Next.js, TypeScript' },
            { k: 'Store', v: 'SQLite on a volume' },
            { k: 'AI', v: 'Any OpenAI-style provider' },
            { k: 'Deploy', v: 'One container' },
          ].map((row) => (
            <div key={row.k} className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {row.k}
              </dt>
              <dd className="text-right text-sm font-semibold">{row.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <CTABand
        title="See whether it holds up on your material."
        body="The fastest way to judge KLAXO is to give it a unit you already know well and read what comes back."
      />
    </div>
  );
}
