import Link from 'next/link';
import { Button, ButtonAffordance } from '@/components/ui/button';
import { ArrowRightIcon } from '@/components/ui/icon';
import { Window, IconTile } from '@/components/ui/window';
import { cn } from '@/lib/utils/cn';
import { BitStrip, UnmeasuredStrip } from '@/components/ui/bits';
import { SourceBadge } from '@/components/ui/source-badge';
import { countPublishedQuestions } from '@/lib/services/questions';
import { db } from '@/lib/db/client';
import { syllabusNodes, examPapers } from '@/lib/db/schema';
import { eq, and, count, asc } from 'drizzle-orm';

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
 * reading refuses to be a number. Every competitor in this category shows 100%
 * there. That refusal — rendered as a dashed outline with nothing inside,
 * which is a different object from a bar drawn at zero — is the thesis, and it
 * is the first thing on the page: three pastel readings stacked on a raised
 * sheet, the way the reference stacks its course cards.
 */
export default async function LandingPage() {
  const [questionCount, topicRows, paperRows, units] = await Promise.all([
    countPublishedQuestions(),
    db
      .select({ n: count() })
      .from(syllabusNodes)
      .where(and(eq(syllabusNodes.level, 'topic'), eq(syllabusNodes.isActive, true))),
    db.select({ n: count() }).from(examPapers),
    db
      .select({ code: syllabusNodes.code, title: syllabusNodes.title })
      .from(syllabusNodes)
      .where(and(eq(syllabusNodes.level, 'unit'), eq(syllabusNodes.isActive, true)))
      .orderBy(asc(syllabusNodes.sortOrder)),
  ]);

  const topics = topicRows[0]?.n ?? 0;
  const papers = paperRows[0]?.n ?? 0;

  return (
    <>
      {/* ---------- opening ---------- */}
      <section>
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-8 sm:px-6 sm:pb-28 sm:pt-14 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
          <div>
            <h1 className="display-xl text-[42px] sm:text-[72px]">
              Find out what you actually know
            </h1>

            <p className="mt-7 max-w-[50ch] text-[17px] leading-[1.65] text-muted">
              Practice for the G.C.E. O/L ICT paper that does more than count your score.
              It tells you which topics are solid, which are not, and what to do about it —
              question by question, with the reasoning explained every time.
            </p>

            <div className="mt-9 flex flex-col gap-2.5 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Start practising
                  <ButtonAffordance>
                    <ArrowRightIcon size={14} />
                  </ButtonAffordance>
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/methodology">How we write questions</Link>
              </Button>
            </div>

            {/* What is in the bank today, as one plain line — counts, not a scoreboard. */}
            <p className="mt-10 text-[14px] leading-relaxed text-muted tabular">
              <span className="text-ink">{questionCount}</span> questions live ·{' '}
              <span className="text-ink">{topics}</span> syllabus topics ·{' '}
              <span className="text-ink">{papers}</span> past papers
            </p>
          </div>

          {/* The mechanism, performed rather than described. */}
          <Window tone="raised" title="Worked example" note="One topic, three points in time">
            <ul className="flex flex-col gap-3">
              <ConfidenceRow
                tint="lilac"
                sample="2 answered · both right"
                naive="100%"
                shown="No reading yet"
                filled={0}
                unmeasured
              />
              <ConfidenceRow
                tint="sky"
                sample="8 answered · 6 right"
                naive="75%"
                shown="67% · early estimate"
                filled={13}
                soft
              />
              <ConfidenceRow
                tint="mint"
                sample="40 answered · 34 right"
                naive="85%"
                shown="82%"
                filled={16}
              />
            </ul>

            <p className="mt-5 text-[13px] leading-relaxed text-muted">
              An illustration of the rule, not one student&rsquo;s record. Struck-through
              figures are what a naive score would have told you at that point.
            </p>
          </Window>
        </div>
      </section>

      {/* ---------- the loop ---------- */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <h2 className="section-title max-w-[20ch]">
            Every question you answer changes what we ask next
          </h2>
          <p className="mt-5 max-w-[54ch] text-[16px] leading-relaxed text-muted">
            That is the whole product. There is no separate &ldquo;study mode&rdquo; —
            practising <em>is</em> how the system learns where you are.
          </p>

          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Step
              n={1}
              tint="lilac"
              title="You answer"
              body="A question from a topic chosen for you, at a difficulty just above where you are."
            />
            <Step
              n={2}
              tint="sky"
              title="You find out why"
              body="Not just the right answer — why the option you picked was wrong, and what that misunderstanding usually is."
            />
            <Step
              n={3}
              tint="mint"
              title="Your topic map shifts"
              body="Mastery updates for that topic and its unit, weighted by difficulty and how recent the evidence is."
            />
            <Step
              n={4}
              tint="peach"
              title="The next set changes"
              body="Weak topics, questions due for review, and mistakes you have not yet fixed — each labelled with why it is there."
            />
          </ol>
        </div>
      </section>

      {/* ---------- provenance ---------- */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <h2 className="section-title max-w-[20ch]">
            We tell you where every question came from
          </h2>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
            <div className="flex flex-col gap-5 text-[16px] leading-relaxed text-muted">
              <p>
                Answer two questions on a topic correctly and most apps will show you 100%.
                That is not a measurement — it is flattery, and it is the most likely way a
                practice app can mislead you about how ready you are.
              </p>
              <p>
                The same applies to sources. Every question carries where it came from,
                and the two labels are impossible to confuse: a different mark, a
                different ground, a different outline and different words. Four signals,
                so the distinction survives a colour-blind reader, a bad screen and
                direct sunlight — any one of which would defeat a colour alone.
              </p>
            </div>

            {/*
              Two real questions from the bank, set at question size with the
              labels students see — the distinction shown, not described.
            */}
            <div className="flex flex-col gap-4">
              <Specimen
                source={{
                  type: 'past_paper',
                  paper: { year: 2025, sitting: '2025(2026)', paperNo: 1 },
                  questionNumber: 5,
                }}
                stem="In which of the following network topologies does every computer connect to a central device such as a switch?"
              />
              <Specimen
                source={{ type: 'model', paper: null, questionNumber: null }}
                stem="Which spreadsheet function counts only the cells in a range that contain numbers?"
              />
              <p className="px-1 text-[14px] leading-relaxed text-muted">
                A question we wrote will never be dressed up as one that appeared in a real
                examination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- close ---------- */}
      <section className="px-3 pb-16 sm:px-6 sm:pb-24">
        <div className="glass-raised mx-auto grid max-w-6xl gap-12 rounded-[28px] px-6 py-14 sm:rounded-2xl sm:px-14 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <h2 className="section-title max-w-[24ch]">
              Built on the actual syllabus, not a guess at it
            </h2>
            <p className="mt-5 max-w-[56ch] text-[16px] leading-relaxed text-muted">
              The topic structure is transcribed from the National Institute of Education
              Teacher&rsquo;s Guide and the Grade 10 and 11 textbooks — {topics} topics across
              fifteen units, with the syllabus&rsquo;s own teaching-period weightings.
            </p>

            <div className="mt-9 flex flex-col gap-2.5 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Create a free account
                  <ButtonAffordance>
                    <ArrowRightIcon size={14} />
                  </ButtonAffordance>
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/syllabus">See what&rsquo;s covered</Link>
              </Button>
            </div>
          </div>

          <ol aria-label="Syllabus units" className="grid content-start gap-x-6 gap-y-1 sm:grid-cols-2">
            {units.map((u) => (
              <li
                key={u.code}
                className="flex items-baseline gap-3 border-t border-line-soft py-2.5 text-[14px] leading-snug"
              >
                <span className="w-6 shrink-0 font-mono text-[13px] text-muted tabular">{u.code}</span>
                {u.title}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

const TINT = {
  lilac: 'tint-lilac',
  sky: 'tint-sky',
  mint: 'tint-mint',
  peach: 'tint-peach',
} as const;

/** One question as a student meets it: its label, then its stem at question size. */
function Specimen({
  source,
  stem,
}: {
  source: React.ComponentProps<typeof SourceBadge>['source'];
  stem: string;
}) {
  return (
    <article className="glass-raised rounded-[24px] p-6 sm:rounded-xl sm:p-7">
      <SourceBadge source={source} />
      <p className="mt-4 text-[18px] leading-relaxed">{stem}</p>
    </article>
  );
}

function Step({
  n,
  tint,
  title,
  body,
}: {
  n: number;
  tint: keyof typeof TINT;
  title: string;
  body: string;
}) {
  return (
    <li className={cn('flex flex-col rounded-[24px] p-6 sm:rounded-xl sm:p-7', TINT[tint])}>
      <IconTile size="sm">
        <span className="text-[14px] font-medium">{n}</span>
      </IconTile>
      <h3 className="mt-6 text-[22px] leading-tight tracking-[-0.03em]">{title}</h3>
      <p className="mt-2.5 text-[15px] leading-relaxed opacity-85">{body}</p>
    </li>
  );
}

function ConfidenceRow({
  tint,
  sample,
  naive,
  shown,
  filled,
  unmeasured,
  soft,
}: {
  tint: keyof typeof TINT;
  sample: string;
  naive: string;
  shown: string;
  filled: number;
  unmeasured?: boolean;
  /** An early estimate fills at 75% — heavy, but short of committed. */
  soft?: boolean;
}) {
  return (
    <li className={cn('rounded-[20px] p-5', TINT[tint])}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[20px] leading-tight tracking-[-0.025em]">{shown}</p>
        <span className="shrink-0 text-[14px] line-through opacity-70">{naive}</span>
      </div>
      <p className="mt-1 text-[13px] opacity-80">{sample}</p>
      {unmeasured ? (
        <UnmeasuredStrip className="mt-3" />
      ) : (
        <BitStrip filled={filled} total={20} soft={soft} className="mt-3" />
      )}
    </li>
  );
}
