import type { Metadata } from 'next';
import { db } from '@/lib/db/client';
import { examPapers } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

export const metadata: Metadata = { title: 'How we write questions' };

/**
 * The trust page.
 *
 * This exists to say plainly what we have, what we do not have, and what we
 * do about the gap. Credibility comes from being specific — including about
 * the five years whose marking schemes we still do not hold, which is the
 * least flattering fact here and therefore the most important one to state.
 */
export default async function MethodologyPage() {
  const papers = await db.select().from(examPapers).orderBy(asc(examPapers.year));

  return (
    <article className="mx-auto max-w-[48rem] px-3 pb-16 pt-6 sm:px-5 sm:pb-24 sm:pt-10">
      <h1 className="page-title">
        How we write and check questions
      </h1>
      <p className="mb-10 mt-5 text-[17px] leading-relaxed text-muted">
        Practice is only worth doing if the answers are right. Here is exactly how our
        content is produced, what we are confident about, and where we are not.
      </p>

      <Section title="Two kinds of question, never mixed">
        <p>
          <strong>Model questions</strong> are written by us against the syllabus. They are
          original — designed to test the same understanding an examiner would, without
          pretending to be something they are not.
        </p>
        <p>
          <strong>Past paper questions</strong> are transcribed from real G.C.E. O/L ICT
          examination papers, and always carry the year, paper and question number.
        </p>
        <p>
          The two are labelled differently everywhere they appear, using different chrome,
          different ground, different marks and different wording — never colour alone.
        </p>
      </Section>

      <Section title="What we have, and what we do not">
        <p>
          We hold the official Department of Examinations marking scheme for ten of the
          fifteen papers we work from. For the other five &mdash; 2010, 2011, 2015, 2016
          and 2024 &mdash; no official marking scheme has been published to us, so we do
          not know the official answers to those questions.
        </p>
        <p>
          For three of those five we do hold a commercially published answer booklet. We
          treat it as a reference a reviewer may consult, never as an authority: it does
          not come from the Department, and we do not mark an answer
          &ldquo;official&rdquo; on the strength of it.
        </p>
        <p>
          A transcribed past-paper question does not go live when it is transcribed, whether
          or not we hold its key. Where there is no marking scheme, it sits as a draft with
          no answer until a qualified reviewer determines one and a second reviewer
          independently agrees. Where there is a marking scheme, the answer comes from that
          document &mdash; but a reviewer still has to check our transcription against the
          original paper first, because an official answer to a question we have copied
          down wrongly would be worse than no answer at all.
        </p>
        <p>
          A few questions have no single right answer because the Department itself accepted
          more than one option, or withdrew the question after the examination. We record
          those as they were marked and do not invent an answer for them.
        </p>
        <p>
          This is enforced by the database itself, not by anyone remembering to be careful:
          a question marked unverified cannot be set to published by any code path.
        </p>
        <p>
          Where an answer has been established by our reviewers rather than matched against
          an official marking scheme, we say so on the question. We will not describe our
          answer as &ldquo;official&rdquo; when it is ours.
        </p>
      </Section>

      <Section title="Review, before anything reaches a student">
        <ol className="flex list-decimal flex-col gap-2 pl-5">
          <li>Drafted — by a teacher, or transcribed from a paper.</li>
          <li>Submitted for review, with the topic, difficulty and explanation attached.</li>
          <li>Reviewed — the answer key, the wording and the explanation are all checked.</li>
          <li>
            Past-paper questions need a <strong>second, independent approver</strong>.
          </li>
          <li>Published. Every version and every decision is kept.</li>
        </ol>
        <p>
          A published question must have an explanation. That is also a database rule, so an
          answer can never appear without the reasoning behind it.
        </p>
      </Section>

      <Section title="We watch for our own bad questions">
        <p>
          Once a question has been answered enough times, we can measure whether it is
          working. If students who do well overall get a particular question wrong more
          often than students who do poorly, that question is almost certainly flawed —
          ambiguous wording, or a wrong key.
        </p>
        <p>
          Those questions are flagged automatically for re-review. You can also report any
          question directly from the screen where you meet it, and that report goes into
          the same queue.
        </p>
      </Section>

      <Section title="What we will not claim">
        <p>
          We do not claim our questions predict the paper. We do not claim a grade. We do
          not claim to be affiliated with the Department of Examinations or the National
          Institute of Education, because we are not.
        </p>
        <p>
          What we do claim is this: the topics come from the published syllabus, the answers
          are checked by people before you see them, and when we are unsure we say so rather
          than guessing.
        </p>
      </Section>

      <Section title="The papers we work from">
        <p>An honest account of the state of each source document.</p>

        <div className="overflow-x-auto rounded-[18px] bg-raised shadow-[inset_0_0_0_1px_var(--color-line-soft)]">
          <table className="w-full min-w-[30rem] border-collapse">
            <thead>
              <tr className="border-b border-line-soft text-left">
                <Th>Year</Th>
                <Th>Sitting</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {papers.map((p) => (
                <tr key={p.id} className="border-b border-line-soft last:border-b-0">
                  <td className="px-5 py-3 text-[15px] font-medium text-ink tabular">{p.year}</td>
                  <td className="px-5 py-3 text-[14px]">{p.sitting}</td>
                  <td className="px-5 py-3 text-[14px]">
                    {p.notes ? (
                      <span className="rounded-full bg-caution-soft px-2.5 py-1 text-[12px] font-medium text-caution">
                        Source needs work
                      </span>
                    ) : (
                      'Indexed'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[13px]">
          The 2013 paper is not yet in our collection — the file we were given under that
          name turned out to be a duplicate of 2012. We would rather show a gap than a wrong
          year.
        </p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass mt-4 rounded-[24px] p-6 sm:rounded-xl sm:p-9">
      <h2 className="text-[22px] leading-tight tracking-[-0.03em]">{title}</h2>
      <div className="mt-4 flex flex-col gap-4 text-[15px] leading-relaxed text-muted [&_strong]:text-ink">{children}</div>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="eyebrow px-5 py-3 text-left font-medium">
      {children}
    </th>
  );
}
