import type { Metadata } from 'next';
import { CTABand, FaqList, PageHero, SectionHeading } from '@/components/site/blocks';

export const metadata: Metadata = {
  title: 'For educators — KLAXO',
  description:
    'What KLAXO does for the person planning the course: structure from your own material, share links for students, mastery per objective.',
};

const jobs = [
  {
    title: 'You already have the material',
    body: 'A syllabus, a stack of notes, chapters you like. KLAXO starts from those instead of asking you to describe your course to a chatbot from memory.',
  },
  {
    title: 'You need it in order',
    body: 'Objectives are sequenced by what depends on what, so a lesson never quietly assumes something the class has not covered yet.',
  },
  {
    title: 'You need practice that matches',
    body: 'Every objective gets its own practice and assessment items, written against that objective rather than the topic in general.',
  },
  {
    title: 'You need to see who has it',
    body: 'Mastery is tracked per objective from real attempts, so the gap shows up as a specific objective, not a low overall score.',
  },
];

const faqs = [
  {
    q: 'Do my students need accounts?',
    a: 'No. You share a link, they type a name, and they are in the course. Only educators sign up.',
  },
  {
    q: 'Can I edit what it generates?',
    a: 'Yes. Every stage produces something you can read and change before moving on, and revisions are versioned so nothing is overwritten silently.',
  },
  {
    q: 'What file types can I upload?',
    a: 'Text and markdown, PDFs, images of pages or slides, and anything you can paste in as prose.',
  },
  {
    q: 'Where does my material go?',
    a: 'Sources are stored with your course on the server running KLAXO, and the text is sent to whichever AI provider that install is configured with in order to build the course. What that provider then does with it is set by their own terms, so a school that needs a specific answer can self-host and pick the provider.',
  },
];

export default function ForEducatorsPage() {
  return (
    <div className="space-y-16">
      <PageHero
        kicker="For educators"
        title="Course planning that starts from"
        highlight="your own material."
        lede="KLAXO is built for the person who already has the sources and the standards, and needs the structure, the practice, and the tracking that normally take a term of evenings."
      />

      <section>
        <SectionHeading kicker="The work it takes off you" title="Four jobs, done properly." />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {jobs.map((job) => (
            <div key={job.title} className="rounded-2xl border-[1.5px] border-ink bg-card p-6 shadow-pop">
              <h3 className="font-display text-lg font-bold">{job.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{job.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 rounded-2xl border-[1.5px] border-ink bg-card p-7 shadow-pop lg:grid-cols-2 lg:p-10">
        <div>
          <p className="kicker">Sharing</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold">One link per course.</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Turn on sharing for a course and you get a link to hand out. Students open it,
            enter a name, and go straight to the lessons and practice. You can turn the link
            off again whenever you want, and their progress stays attached to the course.
          </p>
        </div>
        <div className="rounded-xl border-[1.5px] border-ink bg-background p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Share link
          </p>
          <p className="mt-3 break-all rounded-lg bg-secondary px-3 py-2.5 font-mono text-sm">
            /learn/9f3c-a1d7-4e2b
          </p>
          <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
            <li>· No student accounts, no passwords to reset</li>
            <li>· Works on a school Chromebook or a phone</li>
            <li>· Revoke it and the link stops working</li>
          </ul>
        </div>
      </section>

      <section>
        <SectionHeading kicker="Questions" title="The ones that come up first." />
        <FaqList items={faqs} />
      </section>

      <CTABand
        title="Put one unit through it and see."
        body="Create an account, upload the sources for a single unit, and compare what comes out with what you would have written."
      />
    </div>
  );
}
