import { Reveal } from '@/components/Reveal';
import { Wrap } from '@/components/ui';

/** The top of every page except home, so inner pages share one entrance. */
export function PageHero({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede: string;
}) {
  return (
    <section className="pb-4 pt-16 sm:pt-20">
      <Wrap>
        <Reveal>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-4 max-w-[19ch] text-[clamp(2.1rem,4.1vw,3.2rem)] font-bold leading-[1.04]">
            {title}
          </h1>
        </Reveal>
        <Reveal delay={90}>
          <p className="prose-voice mt-6 text-[1.125rem]">{lede}</p>
        </Reveal>
      </Wrap>
    </section>
  );
}
