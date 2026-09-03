import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Window, Label } from '@/components/ui/window';
import { BitStrip, UnmeasuredStrip, Numeral } from '@/components/ui/bits';
import { SourceBadge } from '@/components/ui/source-badge';
import { countPublishedQuestions } from '@/lib/services/questions';
import { db } from '@/lib/db/client';
import { syllabusNodes, examPapers } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';

/**
 * The landing page.
 *
 * The audience includes parents deciding whether a child may use this, and
 * teachers deciding whether to recommend it — so the job is to make the
 * method legible, not to sell hard. No claims about grades, nothing here we
 * cannot back up.
 *
 * The first viewport does not describe the product; it performs its one
 * genuinely uncommon behaviour. Two questions answered, both right, and the
 * reading refuses to be a number. Every competitor in this category shows
 * 100% there. That refusal, rendered as a different material — a 12% dither
 * behind a dashed rule rather than a bar drawn at zero — is the thesis, and
 * it is the first thing on the page.
 */
export default async function LandingPage() {
  const [questionCount, topicRows, paperRows] = await Promise.all([
    countPublishedQuestions(),
    db
      .select({ n: count() })
      .from(syllabusNodes)
      .where(and(eq(syllabusNodes.level, 'topic'), eq(syllabusNodes.isActive, true))),
    db.select({ n: count() }).from(examPapers),
  ]);

  const topics = topicRows[0]?.n ?? 0;
  const papers = paperRows[0]?.n ?? 0;

  return (
    <>
      {/* ---------- opening ---------- */}
      <section className="dither-50 border-b border-ink">
        <div className="mx-auto grid max-w-5xl gap-3 px-0 py-4 sm:px-5 sm:py-12 lg:grid-cols-[1.05fr_1fr] lg:items-start">
          <Window bodyClassName="px-4 py-8 sm:px-7 sm:py-10">
            <h1 className="font-pixel text-[24px] uppercase leading-[1.35] sm:text-[32px] lg:text-[48px]">
              Find out what you actually know
            </h1>

            <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.6]">
              Practice for the{' '}
              <strong className="font-semibold">G.C.E. Ordinary Level ICT</strong> paper
              that does more than count your score. It tells you which topics are solid,
              which are not, and what to do about it — question by question, with the
              reasoning explained every time.
            </p>

            <div className="mt-8 flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/sign-up">Start practising</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/methodology">How we write questions</Link>
              </Button>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-ink pt-6">
              <Stat value={questionCount} label="Questions" slots={4} />
              <Stat value={topics} label="Topics" slots={3} />
              <Stat value={papers} label="Papers" slots={3} />
            </dl>
          </Window>

          {/* The mechanism, performed rather than described. */}
          <Window title="Worked example" note="Topic 3.2">
            <ul className="flex flex-col">
              <ConfidenceRow
                sample="2 answered · both right"
                naive="100%"
                shown="No reading yet"
                filled={0}
                unmeasured
              />
              <ConfidenceRow
                sample="8 answered · 6 right"
                naive="75%"
                shown="67% · early estimate"
                filled={13}
                soft
              />
              <ConfidenceRow
                sample="40 answered · 34 right"
                naive="85%"
                shown="82%"
                filled={16}
                last
              />
            </ul>

            <p className="mt-4 border-t border-ink pt-3 text-[13px] leading-relaxed">
              An illustration of the rule, not one student&rsquo;s record. Struck-through
              figures are what a naive score would have told you at that point.
            </p>
          </Window>
        </div>
      </section>

      {/* ---------- the loop ---------- */}
      <section className="border-b border-ink">
        <div className="mx-auto max-w-5xl px-3 py-14 sm:px-5">
          <h2 className="font-pixel text-[24px] uppercase leading-tight">
            Every question you answer changes what we ask next
          </h2>
          <p className="mt-3 max-w-[54ch] text-[15px] leading-relaxed">
            That is the whole product. There is no separate &ldquo;study mode&rdquo; —
            practising <em>is</em> how the system learns where you are.
          </p>

          <ol className="mt-8 grid gap-px border border-ink bg-ink sm:grid-cols-2 lg:grid-cols-4">
            <Step
              n={1}
              title="You answer"
              body="A question from a topic chosen for you, at a difficulty just above where you are."
            />
            <Step
              n={2}
              title="You find out why"
              body="Not just the right answer — why the option you picked was wrong, and what that misunderstanding usually is."
            />
            <Step
              n={3}
              title="Your topic map shifts"
              body="Mastery updates for that topic and its unit, weighted by difficulty and how recent the evidence is."
            />
            <Step
              n={4}
              title="The next set changes"
              body="Weak topics, questions due for review, and mistakes you have not yet fixed — each labelled with why it is there."
            />
          </ol>
        </div>
      </section>

      {/* ---------- provenance ---------- */}
      <section className="border-b border-ink">
        <div className="mx-auto max-w-5xl px-3 py-14 sm:px-5">
          <h2 className="font-pixel text-[24px] uppercase leading-tight">
            We tell you where every question came from
          </h2>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
            <div className="flex flex-col gap-4 text-[15px] leading-relaxed">
              <p>
                Answer two questions on a topic correctly and most apps will show you 100%.
                That is not a measurement — it is flattery, and it is the most likely way a
                practice app can mislead you about how ready you are.
              </p>
              <p>
                The same applies to sources. Every question carries where it came from, and
                the two labels are impossible to confuse: different chrome, different
                ground, different mark, different words. Not different colours — there are
                no colours here, so nothing about this distinction can fail for a
                colour-blind reader or a bad screen.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <SourceBadge
                  source={{
                    type: 'past_paper',
                    paper: { year: 2023, sitting: '2023(2024)', paperNo: 1 },
                    questionNumber: 6,
                  }}
                />
                <SourceBadge source={{ type: 'model', paper: null, questionNumber: null }} />
              </div>
              <p className="text-[13px] leading-relaxed">
                A question we wrote will never be dressed up as one that appeared in a real
                examination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- close ---------- */}
      <section>
        <div className="mx-auto max-w-5xl px-3 py-14 sm:px-5">
          <h2 className="font-pixel max-w-[24ch] text-[24px] uppercase leading-tight">
            Built on the actual syllabus, not a guess at it
          </h2>
          <p className="mt-4 max-w-[56ch] text-[15px] leading-relaxed">
            The topic structure is transcribed from the National Institute of Education
            Teacher&rsquo;s Guide and the Grade 10 and 11 textbooks — {topics} topics across
            fifteen units, with the syllabus&rsquo;s own teaching-period weightings.
          </p>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/sign-up">Create a free account</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/syllabus">See what&rsquo;s covered</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label, slots }: { value: number; label: string; slots: number }) {
  return (
    <div>
      <dd>
        <Numeral value={value} slots={slots} size="xl" />
      </dd>
      <Label as="dt" className="mt-2">
        {label}
      </Label>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="bg-paper p-5">
      <Numeral value={n} slots={1} size="md" />
      <h3 className="font-pixel mt-3 text-[16px] uppercase leading-none">{title}</h3>
      <p className="mt-2.5 text-[14px] leading-relaxed">{body}</p>
    </li>
  );
}

function ConfidenceRow({
  sample,
  naive,
  shown,
  filled,
  unmeasured,
  soft,
  last,
}: {
  sample: string;
  naive: string;
  shown: string;
  filled: number;
  unmeasured?: boolean;
  /** An early estimate fills at 75% — heavy, but short of committed. */
  soft?: boolean;
  last?: boolean;
}) {
  return (
    <li className={last ? '' : 'mb-4 border-b border-dashed border-ink pb-4'}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-pixel text-[16px] uppercase leading-none">{sample}</span>
        <span className="shrink-0 text-[14px] line-through">{naive}</span>
      </div>
      <p className="mt-2 text-[15px] font-semibold">{shown}</p>
      {unmeasured ? (
        <UnmeasuredStrip className="mt-2" />
      ) : (
        <BitStrip filled={filled} total={20} soft={soft} className="mt-2" />
      )}
    </li>
  );
}
