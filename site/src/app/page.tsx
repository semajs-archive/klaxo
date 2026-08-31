import { SpineDiagram } from '@/components/SpineDiagram';
import { Reveal } from '@/components/Reveal';
import { BeforeAfter, JoinPhone, MasteryGrid, ProvenanceCard } from '@/components/showcase';
import { Band, ButtonLink, SectionHead, Wrap } from '@/components/ui';
import { SIGN_IN_HREF, START_HREF } from '@/lib/cn';

const PASSES = [
  { title: 'Reads it', body: 'Whatever you hand over, as it is.' },
  { title: 'Orders it', body: 'Nothing before the thing it depends on.' },
  { title: 'Writes it', body: 'Each lesson aimed at one objective.' },
  { title: 'Checks it', body: 'A second pass rewrites what fails.' },
];

const ANSWERS = [
  {
    q: 'Is it accurate?',
    a: 'You can check it. Every line names the page it came from, and a second pass rewrites what does not hold up.',
  },
  {
    q: 'What happens to my material?',
    a: 'It stays attached to your course and is used to build it. Nothing is published, and nothing is shared with other people.',
  },
  {
    q: 'What does it cost?',
    a: 'Nothing while it is in beta. No card, no seat count. If that changes you will hear it from us first.',
  },
];

export default function HomePage() {
  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="pt-10 sm:pt-16">
        <Wrap>
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)]">
            <div>
              <Reveal>
                <h1 className="max-w-[16ch] text-[clamp(2rem,4.35vw,3.4rem)] font-bold leading-[1.04]">
                  A course you can check, line by line.
                </h1>
              </Reveal>
              <Reveal delay={80}>
                <p className="prose-voice mt-5 max-w-[42ch] text-[1.0625rem] sm:text-[1.125rem]">
                  Hand over what you already teach from. KLAXO builds the course — and keeps every
                  line tied to the page it came from.
                </p>
              </Reveal>
              <Reveal delay={160}>
                <div className="mt-7 flex flex-wrap gap-3">
                  <ButtonLink href={START_HREF}>Start a course — free</ButtonLink>
                  <ButtonLink href="/how-it-builds" variant="ghost">
                    See how it builds
                  </ButtonLink>
                </div>
                <p className="mt-3 text-[0.8125rem] text-ink-3">
                  No account needed. Sign up later to keep it.
                </p>
              </Reveal>
            </div>

            <Reveal delay={220}>
              <SpineDiagram />
            </Reveal>
          </div>
        </Wrap>
      </section>

      {/* ----------------------------------------------- centrepiece: before/after */}
      <Band>
        <Reveal>
          <SectionHead
            eyebrow="One unit"
            title="What you start with. What you end with."
          />
        </Reveal>
        <Reveal delay={100} className="mt-9">
          <BeforeAfter />
        </Reveal>
      </Band>

      {/* -------------------------------------------------------- provenance */}
      <Band deep>
        <Reveal>
          <SectionHead
            eyebrow="Shows its work"
            title="Every line says where it came from."
            lede="This is the part a chatbot cannot do. You are not asked to trust it — you are shown the page."
          />
        </Reveal>
        <Reveal delay={100} className="mt-9">
          <ProvenanceCard />
        </Reveal>
      </Band>

      {/* ----------------------------------------------------------- passes */}
      <Band>
        <Reveal>
          <SectionHead eyebrow="Four passes" title="It reads, orders, writes, then marks itself." />
        </Reveal>
        <ol className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PASSES.map((pass, i) => (
            <Reveal as="li" key={pass.title} delay={i * 80}>
              <span className="grid h-9 w-9 place-items-center rounded-full border border-line text-[0.8125rem] font-semibold tabular-nums text-ink-2">
                {i + 1}
              </span>
              <h3 className="mt-4 text-[1.0625rem] font-semibold tracking-[-0.018em]">{pass.title}</h3>
              <p className="mt-1.5 text-[0.9375rem] text-ink-2">{pass.body}</p>
            </Reveal>
          ))}
        </ol>
      </Band>

      {/* ---------------------------------------------------------- mastery */}
      <Band deep>
        <Reveal>
          <SectionHead
            eyebrow="Afterwards"
            title="Who has actually met it."
            lede="Not who opened the lesson. Who met the objective."
          />
        </Reveal>
        <Reveal delay={100} className="mt-9">
          <MasteryGrid />
        </Reveal>
      </Band>

      {/* ---------------------------------------------------------- sharing */}
      <Band>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <SectionHead
              eyebrow="Students"
              title="One link, and they are in."
              lede="They type a name and start. Nothing to install, no password to reset."
            />
            <div className="mt-7">
              <ButtonLink href="/students" variant="ghost">
                How sharing works
              </ButtonLink>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <JoinPhone />
          </Reveal>
        </div>
      </Band>

      {/* ---------------------------------------------------------- answers */}
      <Band deep>
        <Reveal>
          <SectionHead eyebrow="Straight answers" title="The three things people ask." />
        </Reveal>
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {ANSWERS.map((item, i) => (
            <Reveal key={item.q} delay={i * 80}>
              <div className="h-full rounded-[12px] border border-line-soft bg-surface p-6">
                <h3 className="text-[1.0625rem] font-semibold tracking-[-0.018em]">{item.q}</h3>
                <p className="prose-voice mt-2.5 text-[0.9375rem]">{item.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Band>

      {/* ------------------------------------------------------------ close */}
      <section className="bg-band py-20 text-on-band sm:py-24">
        <Wrap>
          <Reveal>
            <h2 className="max-w-[15ch] text-[clamp(1.75rem,3.4vw,2.85rem)] font-bold leading-[1.06]">
              Put one unit through it.
            </h2>
            <p className="prose-voice mt-4 text-on-band-2">
              Take something you know well. You will see in a minute whether the order it gives you
              is right.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={START_HREF} variant="on-band">
                Start a course — free
              </ButtonLink>
              <ButtonLink href={SIGN_IN_HREF} variant="on-band-ghost">
                Sign in
              </ButtonLink>
            </div>
          </Reveal>
        </Wrap>
      </section>
    </>
  );
}
