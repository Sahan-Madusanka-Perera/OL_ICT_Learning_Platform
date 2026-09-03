import { Window, Label } from '@/components/ui/window';
import { Button } from '@/components/ui/button';
import { Numeral } from '@/components/ui/bits';
import { startRecommendedPractice, startQuickPractice } from '@/lib/actions/practice';
import type { Recommendation } from '@/lib/domain/recommendation';

/**
 * The most important window on the dashboard.
 *
 * It shows the composition of the recommended set, not just a button. A
 * student who can see "5 from Logic Gates — your weakest topic, 5 due for
 * review" understands why they are being asked to do this, which is the
 * difference between a study tool and a slot machine.
 *
 * The set's size takes reserved monumental digits: the quantity is the first
 * thing the eye lands on, and it sits in the same place on every visit.
 */
export function RecommendedCard({
  recommendation,
  isNew,
}: {
  recommendation: Recommendation;
  isNew: boolean;
}) {
  if (recommendation.totalQuestions === 0) {
    return (
      <Window title="Practice">
        <p className="text-[15px] leading-relaxed">
          There are no questions available right now. Please check back shortly.
        </p>
      </Window>
    );
  }

  return (
    <Window
      title={isNew ? 'Start here' : 'Recommended for you'}
      note={`About ${recommendation.estimatedMinutes} min`}
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 text-center">
          <Numeral value={recommendation.totalQuestions} slots={2} size="xl" />
          <Label className="mt-1.5">Questions</Label>
        </div>

        <div className="min-w-0 flex-1">
          {isNew ? (
            <p className="text-[15px] leading-relaxed">
              A spread across the syllabus, so we can find out where you are. After this,
              these sets get targeted at what you actually need.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recommendation.breakdown.map((slot) => (
                <li key={slot.kind} className="flex items-start gap-2.5 text-[15px] leading-snug">
                  <SlotMark kind={slot.kind} />
                  <span>{slot.description}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <form action={startRecommendedPractice} className="sm:flex-1">
          <Button type="submit" size="lg" full>
            Start this set
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
 * Why a slot is in the set, as a 8×8 pixel mark.
 *
 * Four reasons, four distinguishable patterns — the same job the coloured
 * dots did, without asking a colour-blind reader to take it on trust.
 */
const SLOT_CELLS: Record<string, Array<[number, number, number, number]>> = {
  /* weak topic — a hollow cell: the gap itself */
  weak_topic: [
    [0, 0, 8, 2],
    [0, 6, 8, 2],
    [0, 0, 2, 8],
    [6, 0, 2, 8],
  ],
  /* due for review — a solid cell: it is time */
  due_review: [[1, 1, 6, 6]],
  /* recent mistake — the ╳ */
  recent_mistake: [
    [0, 0, 2, 2],
    [2, 2, 2, 2],
    [4, 4, 2, 2],
    [6, 6, 2, 2],
    [6, 0, 2, 2],
    [0, 6, 2, 2],
  ],
  /* coverage — a dispersed pair: ground being filled in */
  coverage: [
    [0, 0, 2, 2],
    [4, 4, 2, 2],
  ],
};

function SlotMark({ kind }: { kind: string }) {
  const cells = SLOT_CELLS[kind] ?? SLOT_CELLS.coverage!;
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden="true"
      className="mt-1.5 shrink-0"
    >
      {cells.map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} />
      ))}
    </svg>
  );
}
