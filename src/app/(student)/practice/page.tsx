import type { Metadata } from 'next';
import { requireUserPage } from '@/lib/auth/guards';
import { getMasteryForLevel } from '@/lib/services/mastery';
import { countMistakes } from '@/lib/services/recommendations';
import { countPublishedQuestions } from '@/lib/services/questions';
import { Window, Label } from '@/components/ui/window';
import { Button } from '@/components/ui/button';
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
    <div className="flex flex-col gap-3">
      <header className="border-y border-ink bg-paper px-3 py-4 sm:border-x sm:px-4">
        <h1 className="font-pixel text-[24px] uppercase leading-tight">Practice</h1>
        <p className="mt-2 text-[15px]">
          {total} questions available. Pick how you want to work.
        </p>
      </header>

      {/* ---- modes. Exactly one is inverted: the one we recommend. ---- */}
      <div className="grid gap-3 sm:grid-cols-2">
        <ModeCard
          action={startRecommendedPractice}
          title="Recommended set"
          body="Built from your weak topics, what's due for review, and mistakes you haven't fixed."
          cta="Start"
          primary
        />
        <ModeCard
          action={startQuickPractice}
          title="Quick practice"
          body="Ten questions from across the syllabus. Good for a spare few minutes."
          cta="Start"
        />
        <ModeCard
          action={startWeakAreaPractice}
          title="Weak areas"
          body="Targeted at the topics where your mastery is lowest — once there's enough data to know."
          cta="Start"
        />
        <ModeCard
          action={startMistakePractice}
          title="Mistake review"
          body={
            mistakes > 0
              ? `${mistakes} ${mistakes === 1 ? 'question' : 'questions'} you've got wrong and not yet fixed.`
              : 'Nothing in your mistake book right now.'
          }
          cta="Start"
          disabled={mistakes === 0}
        />
        <ModeCard
          action={startChallengePractice}
          title="Challenge"
          body="Harder questions only. For when the basics feel comfortable."
          cta="Start"
        />
      </div>

      {/* ---- by unit ---- */}
      {grades.map((grade) => {
        const gradeUnits = units.filter((u) => u.grade === grade);
        if (gradeUnits.length === 0) return null;

        return (
          <Window
            key={grade}
            title={`Grade ${grade}`}
            note={`${gradeUnits.length} units`}
            bodyClassName="px-0 py-0 sm:px-0"
          >
            <ul>
              {gradeUnits.map((unit) => (
                <li key={unit.nodeId} className="border-b border-dashed border-ink last:border-b-0">
                  <form action={startTopicPractice}>
                    <input type="hidden" name="nodeId" value={unit.nodeId} />
                    <button
                      type="submit"
                      className="ant-focus flex min-h-[--spacing-touch] w-full items-center gap-3 px-3 py-3 text-left hover:bg-ink hover:text-paper sm:px-4"
                    >
                      <span className="font-pixel shrink-0 text-[16px] leading-none">
                        <Numeral value={unit.code} slots={2} size="sm" />
                      </span>
                      <span className="min-w-0 flex-1 text-[15px] font-semibold">
                        {unit.title}
                      </span>
                      <MasteryValue view={unit.view} />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </Window>
        );
      })}
    </div>
  );
}

function ModeCard({
  action,
  title,
  body,
  cta,
  primary,
  disabled,
}: {
  action: () => Promise<void>;
  title: string;
  body: string;
  cta: string;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Window title={title} className="flex flex-col" bodyClassName="flex flex-1 flex-col">
      <p className="flex-1 text-[15px] leading-relaxed">{body}</p>
      <form action={action} className="mt-4">
        <Button
          type="submit"
          size="lg"
          variant={primary ? 'primary' : 'secondary'}
          disabled={disabled}
          full
        >
          {cta}
        </Button>
      </form>
    </Window>
  );
}
