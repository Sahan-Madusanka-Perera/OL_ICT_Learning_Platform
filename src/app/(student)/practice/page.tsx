import type { Metadata } from 'next';
import { requireUserPage } from '@/lib/auth/guards';
import { getMasteryForLevel } from '@/lib/services/mastery';
import { countMistakes } from '@/lib/services/recommendations';
import { countPublishedQuestions } from '@/lib/services/questions';
import Link from 'next/link';
import { Window } from '@/components/ui/window';
import { Button, ButtonAffordance } from '@/components/ui/button';
import { ArrowRightIcon, BookmarkIcon, ChevronRightIcon } from '@/components/ui/icon';
import { cn } from '@/lib/utils/cn';
import { Numeral } from '@/components/ui/bits';
import { MasteryValue } from '@/components/ui/mastery';
import {
  startQuickPractice,
  startRecommendedPractice,
  startWeakAreaPractice,
  startMistakePractice,
  startChallengePractice,
  startTopicPractice,
} from '@/lib/actions/practice';

export const metadata: Metadata = { title: 'Practice' };

export default async function PracticePage() {
  const user = await requireUserPage('/practice');

  const [units, mistakes, total] = await Promise.all([
    getMasteryForLevel(user.id, 'unit'),
    countMistakes(user.id),
    countPublishedQuestions(),
  ]);

  const grades = [10, 11] as const;

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 px-1 pt-2 sm:pt-4">
        <div>
          <h1 className="page-title">Practice</h1>
          <p className="mt-3 text-[15px] text-muted">
            {total} questions available. Pick how you want to work.
          </p>
        </div>
        <Button asChild variant="secondary" size="md">
          <Link href="/bookmarks">
            <BookmarkIcon size={16} />
            Saved questions
          </Link>
        </Button>
      </header>

      {/* ---- modes: pastel sheets, and only the recommended one holds the ink pill ---- */}
      <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        <ModeCard
          action={startRecommendedPractice}
          title="Recommended set"
          body="Built from your weak topics, what's due for review, and mistakes you haven't fixed."
          tint="raised"
          primary
        />
        <ModeCard
          action={startQuickPractice}
          title="Quick practice"
          body="Ten questions from across the syllabus. Good for a spare few minutes."
          tint="sky"
        />
        <ModeCard
          action={startWeakAreaPractice}
          title="Weak areas"
          body="Aimed at the topics where your mastery is lowest — once there's enough data to know."
          tint="lilac"
        />
        <ModeCard
          action={startMistakePractice}
          title="Mistake review"
          body={
            mistakes > 0
              ? `${mistakes} ${mistakes === 1 ? 'question' : 'questions'} you've got wrong and not yet fixed.`
              : 'Nothing in your mistake book right now.'
          }
          tint="peach"
          disabled={mistakes === 0}
        />
        <ModeCard
          action={startChallengePractice}
          title="Challenge"
          body="Harder questions only. For when the basics feel comfortable."
          tint="mint"
        />
      </div>

      {/* ---- by unit ---- */}
      <div className="grid items-start gap-5 lg:grid-cols-2 lg:gap-6">
        {grades.map((grade) => {
          const gradeUnits = units.filter((u) => u.grade === grade);
          if (gradeUnits.length === 0) return null;

          return (
            <Window
              key={grade}
              title={`Grade ${grade}`}
              note={`${gradeUnits.length} units · tap one to practise it`}
              bodyClassName="px-3 pb-3 sm:px-4 sm:pb-4"
            >
              <ul className="flex flex-col gap-0.5">
                {gradeUnits.map((unit) => (
                  <li key={unit.nodeId}>
                    <form action={startTopicPractice}>
                      <input type="hidden" name="nodeId" value={unit.nodeId} />
                      <button
                        type="submit"
                        className="group flex min-h-14 w-full items-center gap-3.5 rounded-[18px] px-2 py-2 text-left transition-colors duration-200 hover:bg-sunken sm:px-3"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-sunken text-[14px] font-medium tabular transition-colors duration-200 group-hover:bg-accent group-hover:text-accent-ink">
                          {unit.code}
                        </span>
                        <span className="min-w-0 flex-1 text-[15px]">{unit.title}</span>
                        <MasteryValue view={unit.view} />
                        <ChevronRightIcon
                          size={16}
                          className="shrink-0 text-faint transition-transform duration-300 ease-[var(--ease-settle)] group-hover:translate-x-0.5 motion-reduce:transform-none"
                        />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </Window>
          );
        })}
      </div>
    </div>
  );
}

/**
 * A way to practise, as a pastel sheet — the reference's course card. The
 * tint is identity only; the words say what each mode does.
 */
function ModeCard({
  action,
  title,
  body,
  tint,
  primary,
  disabled,
}: {
  action: () => Promise<void>;
  title: string;
  body: string;
  tint: 'raised' | 'sky' | 'lilac' | 'peach' | 'mint';
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <section
      className={cn(
        'flex h-full flex-col rounded-[24px] p-6 sm:rounded-xl sm:p-7',
        tint === 'raised' && 'glass-raised',
        tint === 'sky' && 'tint-sky',
        tint === 'lilac' && 'tint-lilac',
        tint === 'peach' && 'tint-peach',
        tint === 'mint' && 'tint-mint',
      )}
    >
      <h2 className="text-[22px] leading-tight tracking-[-0.03em]">{title}</h2>
      <p className={cn('mt-2 flex-1 text-[15px] leading-relaxed', primary ? 'text-muted' : 'opacity-85')}>
        {body}
      </p>
      <form action={action} className="mt-6">
        <Button
          type="submit"
          size="lg"
          variant={primary ? 'primary' : 'secondary'}
          disabled={disabled}
          full
        >
          {primary ? 'Start' : disabled ? 'Nothing to review' : 'Start'}
          {primary ? (
            <ButtonAffordance>
              <ArrowRightIcon size={14} />
            </ButtonAffordance>
          ) : null}
        </Button>
      </form>
    </section>
  );
}
