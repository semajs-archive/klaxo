import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const features = [
  {
    title: 'Messy in, mastery out',
    description:
      'Drop in syllabi, textbooks, lecture notes, or plain prose. KLAXO grounds every objective in your source material.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="m9 15 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Structured curriculum',
    description:
      'Every course becomes a clear progression of objectives, lessons, and assessments designed for durable understanding.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M4 19.5 9.5 4l3 7 3-7L20.5 19.5" />
        <path d="M4 19.5h16" />
      </svg>
    ),
  },
  {
    title: 'Mastery-oriented',
    description:
      'Grounded practice and revision loops target genuine mastery, not shallow coverage of a topic list.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="m9 11 3 3L22 4" />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border bg-card px-6 py-20 text-center shadow-sm sm:px-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-50 via-background to-accent-50 dark:from-primary-950/40 dark:via-background dark:to-accent-950/30"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary-300/30 blur-3xl dark:bg-primary-700/20"
        />
        <div className="relative mx-auto max-w-3xl space-y-6">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            AI-powered curriculum engineering
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Turn messy material into a mastery-oriented course.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            KLAXO ingests your real sources — syllabi, textbooks, notes, or a simple
            prompt — and engineers a structured, grounded curriculum designed for
            durable understanding, not memorization.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/dashboard">
              <Button size="lg">Go to Dashboard</Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">
                Create a course
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {feature.icon}
            </div>
            <h2 className="text-lg font-semibold tracking-tight">{feature.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </section>

      {/* Value strip */}
      <section className="mt-10 flex flex-col items-center gap-4 rounded-2xl border bg-gradient-to-r from-primary to-primary-700 p-8 text-center text-primary-foreground sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Ready to build your next course?</h2>
          <p className="mt-1 text-sm text-primary-foreground/80">
            Start from a blank canvas or your own source material — KLAXO does the heavy lifting.
          </p>
        </div>
        <Link href="/dashboard" className="shrink-0">
          <Button
            size="lg"
            variant="secondary"
            className="bg-white text-primary-950 hover:bg-white/90"
          >
            Start engineering
          </Button>
        </Link>
      </section>
    </div>
  );
}