import { Window, IconTile } from '@/components/ui/window';
import { Button, ButtonAffordance } from '@/components/ui/button';
import { ArrowRightIcon, ClockIcon } from '@/components/ui/icon';
import { cn } from '@/lib/utils/cn';
import { Numeral } from '@/components/ui/bits';
import { startRecommendedPractice, startQuickPractice } from '@/lib/actions/practice';
import type { Recommendation } from '@/lib/domain/recommendation';

/**
 * The most important sheet on the dashboard.
 *
 * It shows the composition of the recommended set, not just a button. A
 * student who can see "5 from Logic Gates — your weakest topic, 5 due for
 * review" understands why they are being asked to do this, which is the
 * difference between a study tool and a slot machine.
 *
 * The whole sheet is lilac — the reference's course card — and holds the
 * page's one ink pill. The set's size is a big light numeral and its length
 * sits on an ink-tiled chip.
 *
 * `quiet` hands the ink pill to something more urgent on the same screen —
 * an unfinished session — so there is never more than one.
 */
export function RecommendedCard({
  recommendation,
  isNew,
  quiet = false,
}: {
  recommendation: Recommendation;
  isNew: boolean;
  quiet?: boolean;
}) {
  if (recommendation.totalQuestions === 0) {
    return (
      <Window title="Practice" note="Nothing to practise right now">
        <p className="text-[15px] leading-relaxed text-muted">
          There are no questions available right now. Please check back shortly.
        </p>
      </Window>
    );
  }

  return (
    <Window
      tone="lilac"
      title={isNew ? 'Start here' : 'Recommended for you'}
      note={isNew ? 'A first set, to find out where you are' : 'Built from what you need right now'}
    >
      <div>
        <p className="flex items-baseline gap-2.5">
          <Numeral value={recommendation.totalQuestions} slots={0} size="xl" />
          <span className="text-[18px] tracking-[-0.02em]">questions</span>
        </p>

        {isNew ? (
          <p className="mt-3 max-w-[40ch] text-[15px] leading-relaxed opacity-85">
            A spread across the syllabus. After this, every set is aimed at what you
            actually need.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2.5">
            {recommendation.breakdown.map((slot) => (
              <li key={slot.kind} className="flex items-start gap-3 text-[15px] leading-snug">
                <SlotMark kind={slot.kind} />
                <span>{slot.description}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-5 inline-flex items-center gap-2.5 text-[14px]">
          <IconTile size="sm">
            <ClockIcon size={16} />
          </IconTile>
          About {recommendation.estimatedMinutes} min
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row lg:flex-col 2xl:flex-row">
        <form action={startRecommendedPractice} className="sm:flex-1">
          <Button type="submit" size="lg" variant={quiet ? 'secondary' : 'primary'} full>
            Start this set
            <ButtonAffordance>
              <ArrowRightIcon size={14} />
            </ButtonAffordance>
          </Button>
        </form>
        <form action={startQuickPractice}>
          <Button type="submit" size="lg" variant="secondary" full>
            Just give me 10
          </Button>
        </form>
      </div>
    </Window>
  );
}

/**
 * Why a slot is in the set.
 *
 * Four reasons, four shapes — drawn in the same line language as the rest of
 * the icons rather than as coloured dots, so a colour-blind reader gets the
 * distinction from the geometry. The tint is a second signal on top, never the
 * only one.
 */
const SLOT_MARKS: Record<string, { path: React.ReactNode; tone: string }> = {
  /* weak topic — a hollow square: the gap itself */
  weak_topic: {
    path: <rect x="4.5" y="4.5" width="11" height="11" rx="2.5" />,
    tone: 'text-caution',
  },
  /* due for review — a clock face: it is time */
  due_review: {
    path: (
      <>
        <circle cx="10" cy="10" r="6" />
        <path d="M10 6.5V10l2.5 1.5" />
      </>
    ),
    tone: 'text-ink',
  },
  /* recent mistake — a cross */
  recent_mistake: {
    path: <path d="M6 6l8 8M14 6l-8 8" />,
    tone: 'text-wrong',
  },
  /* coverage — ground being filled in */
  coverage: {
    path: (
      <>
        <path d="M4 10h5" />
        <path d="M11 10h5" />
        <path d="M10 4v12" strokeDasharray="2 3" />
      </>
    ),
    tone: 'opacity-70',
  },
};

function SlotMark({ kind }: { kind: string }) {
  const mark = SLOT_MARKS[kind] ?? SLOT_MARKS.coverage!;
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('mt-0.5 shrink-0', mark.tone)}
    >
      {mark.path}
    </svg>
  );
}
