import Link from 'next/link';

/** Shared marketing-page furniture, so every page on the site reads as one site. */

export function PageHero({
  kicker,
  title,
  highlight,
  lede,
}: {
  kicker: string;
  title: string;
  highlight?: string;
  lede: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border-[1.5px] border-ink bg-card px-6 py-12 shadow-pop-lg sm:px-10 sm:py-16">
      <div aria-hidden="true" className="absolute inset-0 bg-grid" />
      <div className="relative max-w-3xl">
        <p className="kicker">{kicker}</p>
        <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.06] sm:text-5xl">
          {title} {highlight && <span className="marker-hl">{highlight}</span>}
        </h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">{lede}</p>
      </div>
    </section>
  );
}

export function SectionHeading({
  kicker,
  title,
  lede,
}: {
  kicker: string;
  title: string;
  lede?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="kicker">{kicker}</p>
      <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">{title}</h2>
      {lede && <p className="mt-3 leading-7 text-muted-foreground">{lede}</p>}
    </div>
  );
}

export function CTABand({
  kicker = 'Start building',
  title,
  body,
}: {
  kicker?: string;
  title: string;
  body: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border-[1.5px] border-ink bg-primary p-7 text-primary-foreground shadow-pop-lg sm:p-9">
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary-foreground/70">
            {kicker}
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-foreground/75">{body}</p>
        </div>
        <Link
          href="/login?mode=signup"
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-ink bg-brand-500 px-8 font-display text-base font-bold text-on-brand shadow-pop transition-all hover:bg-brand-400 active:translate-y-[3px] active:shadow-none"
        >
          Create an account
        </Link>
      </div>
    </section>
  );
}

export function NumberedList({
  items,
}: {
  items: { title: string; body: string }[];
}) {
  return (
    <ol className="grid gap-5 md:grid-cols-2">
      {items.map((item, index) => (
        <li key={item.title} className="rounded-2xl border-[1.5px] border-ink bg-card p-6 shadow-pop">
          <span className="grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-ink bg-brand-400 font-display text-sm font-bold text-on-brand dark:bg-secondary dark:text-foreground">
            {index + 1}
          </span>
          <h3 className="mt-5 font-display text-lg font-bold">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <dl className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border-[1.5px] border-ink bg-card shadow-pop">
      {items.map((item) => (
        <div key={item.q} className="p-6">
          <dt className="font-display text-lg font-bold">{item.q}</dt>
          <dd className="mt-2 text-sm leading-6 text-muted-foreground">{item.a}</dd>
        </div>
      ))}
    </dl>
  );
}
