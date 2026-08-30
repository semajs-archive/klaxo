import type { Metadata } from 'next';
import { CTABand, NumberedList, PageHero, SectionHeading } from '@/components/site/blocks';

export const metadata: Metadata = {
  title: 'How it works — KLAXO',
  description:
    'The KLAXO pipeline: sources in, blueprint, lessons and practice, QA and revision, mastery tracking.',
};

const stages = [
  {
    title: 'Add your sources',
    body: 'Syllabi, textbook chapters, lecture notes, PDFs, images, or plain typed prose. Everything KLAXO writes later points back at the material you gave it.',
  },
  {
    title: 'Build the blueprint',
    body: 'Sources become units, topics, and measurable objectives, ordered so each one only depends on things a learner has already met.',
  },
  {
    title: 'Generate lessons and practice',
    body: 'Each objective gets explanation, worked examples, practice questions, and assessment items written against the blueprint rather than invented from nothing.',
  },
  {
    title: 'QA, then targeted revision',
    body: 'The course is checked for gaps, mismatches, and questions that do not test what they claim to. Only the parts that fail get rewritten.',
  },
  {
    title: 'Share with students',
    body: 'A share link drops a learner straight into the course. They type a name, no account needed, and start working through it.',
  },
  {
    title: 'Watch mastery, not completion',
    body: 'Progress is tracked per objective from practice attempts, so you can see what is actually understood instead of what was clicked through.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="space-y-16">
      <PageHero
        kicker="The pipeline"
        title="Six stages between raw material and a course you can"
        highlight="hand to a class."
        lede="KLAXO treats course creation as an engineering pipeline, not a single prompt. Every stage saves its work, so a failure part-way through never costs you the curriculum you already built."
      />

      <section>
        <SectionHeading
          kicker="Stage by stage"
          title="What happens to your material."
          lede="You can stop after any stage, edit what came out, and carry on."
        />
        <div className="mt-8">
          <NumberedList items={stages} />
        </div>
      </section>

      <section>
        <SectionHeading
          kicker="Why it is built this way"
          title="Grounded, checked, and recoverable."
        />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            {
              title: 'Provenance',
              body: 'Generated material is tied to the source that justifies it, so you can check a claim instead of trusting it.',
            },
            {
              title: 'Separate QA pass',
              body: 'The model that checks the course is not the same call that wrote it, which catches the confident mistakes.',
            },
            {
              title: 'Resumable jobs',
              body: 'Generation runs as background jobs against a saved course, so a dropped connection or a rate limit is not a restart.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border-[1.5px] border-ink bg-card p-6 shadow-pop">
              <h3 className="font-display text-lg font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <CTABand
        title="Bring the material. KLAXO builds the course."
        body="Create an account and run your first set of sources through the pipeline."
      />
    </div>
  );
}
