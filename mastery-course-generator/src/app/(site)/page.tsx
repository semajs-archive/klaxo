import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const features = [
  {
    eyebrow: 'Step 1',
    title: 'Ground the source',
    description:
      'Drop in syllabi, textbooks, lecture notes, PDFs, images, or plain prose. KLAXO preserves the evidence behind what it builds.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="m9 15 2 2 4-4" />
      </svg>
    ),
  },
  {
    eyebrow: 'Step 2',
    title: 'Engineer the curriculum',
    description:
      'Turn source material into a dependency-aware progression of units, topics, measurable objectives, lessons, practice, and assessments.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M4 19.5 9.5 4l3 7 3-7L20.5 19.5" />
        <path d="M4 19.5h16" />
      </svg>
    ),
  },
  {
    eyebrow: 'Step 3',
    title: 'Measure mastery',
    description:
      'Practice, assessment, QA, revision, and spaced review work together so a course is designed around understanding rather than coverage.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="m9 11 3 3L22 4" />
      </svg>
    ),
  },
];

const explore = [
  {
    href: '/how-it-works',
    title: 'How it works',
    body: 'The six stages your material moves through, and what you can edit at each one.',
    cta: 'See the pipeline',
  },
  {
    href: '/for-educators',
    title: 'For educators',
    body: 'Share links with no student accounts, mastery per objective, and the questions that come up first.',
    cta: 'What you get',
  },
  {
    href: '/pricing',
    title: 'Pricing',
    body: 'Free to use, open source, and self-hostable with your own AI provider.',
    cta: 'See the terms',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16 pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border-[1.5px] border-ink bg-card shadow-pop-lg">
        <div aria-hidden="true" className="absolute inset-0 bg-grid" />

        <div className="relative grid gap-10 px-6 py-14 sm:px-10 sm:py-18 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:px-14">
          <div className="max-w-3xl">
            <div className="kicker mb-6">AI-powered curriculum engineering</div>
            <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl lg:text-[64px]">
              From messy material to a course you can{' '}
              <span className="marker-hl">actually trust.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              KLAXO turns your real educational sources into a structured, grounded,
              mastery-oriented curriculum — with provenance, assessment, QA, revision,
              and learner mastery built into the workflow.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login?mode=signup">
                <Button size="lg" className="w-full sm:w-auto">Get started — it&apos;s free</Button>
              </Link>
              <Link href="/how-it-works">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">See how it works</Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <span>Source-grounded</span>
              <span aria-hidden="true">·</span>
              <span>QA + targeted revision</span>
              <span aria-hidden="true">·</span>
              <span>Mastery tracking</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:ml-auto">
            <div className="rounded-2xl border-[1.5px] border-ink bg-card p-4 shadow-pop">
              <div className="flex items-center justify-between border-b-[1.5px] border-ink/10 pb-4">
                <div>
                  <p className="kicker text-[11px]">KLAXO pipeline</p>
                  <p className="mt-1 font-display font-bold">Curriculum health</p>
                </div>
                <span className="rounded-lg border border-ink bg-brand-400 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-on-brand">Ready</span>
              </div>
              <div className="space-y-3 py-4">
                {['Sources', 'Blueprint', 'Lessons + practice', 'QA + revision'].map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-xl border bg-background p-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-[1.5px] border-ink bg-brand-400 font-display text-xs font-bold text-on-brand">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{step}</p>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full w-full rounded-full bg-primary" />
                      </div>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-success" aria-hidden="true">
                      <path d="m5 13 4 4L19 7" />
                    </svg>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-secondary p-3 text-xs leading-5 text-muted-foreground">
                Every stage saves its work, so generation can recover without losing the curriculum you already built.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="max-w-2xl">
          <p className="kicker">The workflow</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">Built around the learning loop.</h2>
          <p className="mt-3 text-muted-foreground">
            KLAXO is not just a text generator. It treats course creation as an engineering pipeline with evidence, structure, validation, and feedback.
          </p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="group rounded-2xl border-[1.5px] border-ink bg-card p-6 shadow-pop transition-transform duration-200 hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl border-[1.5px] border-ink bg-brand-400 text-on-brand">
                  {feature.icon}
                </div>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{feature.eyebrow}</span>
              </div>
              <h3 className="mt-6 font-display text-lg font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="max-w-2xl">
          <p className="kicker">Explore</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
            The rest of the story.
          </h2>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {explore.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col rounded-2xl border-[1.5px] border-ink bg-card p-6 shadow-pop transition-transform duration-200 hover:-translate-y-0.5"
            >
              <h3 className="font-display text-lg font-bold">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{item.body}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-primary">
                {item.cta}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-2xl border-[1.5px] border-ink bg-primary p-7 text-primary-foreground shadow-pop-lg sm:p-9">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary-foreground/70">Start building</p>
            <h2 className="mt-1 font-display text-2xl font-bold">Bring the material. KLAXO builds the course.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-foreground/75">
              Start from a blank course or your own source material and move from evidence to a learner-ready curriculum.
            </p>
          </div>
          <Link href="/login?mode=signup" className="shrink-0">
            <Button size="lg" variant="secondary">
              Create an account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
