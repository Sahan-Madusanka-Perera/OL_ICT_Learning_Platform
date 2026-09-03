import { cn } from '@/lib/utils/cn';

/**
 * Provenance badges.
 *
 * The brief is explicit: a model question must never be mistakable for an
 * authentic examination question. These two differ in four ways — chrome
 * (solid vs dashed), ground (white vs 25% dither), mark (seal vs pencil),
 * and wording.
 *
 * The old system had to promise it was not relying on colour. Here that
 * promise is structural: there is no colour to rely on.
 */

type Source = {
  type: 'past_paper' | 'model' | 'textbook_adapted';
  paper: { year: number; sitting: string; paperNo: number } | null;
  questionNumber: number | null;
};

export function SourceBadge({ source, className }: { source: Source; className?: string }) {
  const base =
    'font-pixel inline-flex items-center gap-1.5 whitespace-nowrap px-2 py-1 text-[16px] uppercase leading-none';

  if (source.type === 'past_paper') {
    const ref = source.paper
      ? `${source.paper.year}/P${source.paper.paperNo}${source.questionNumber ? `/Q${source.questionNumber}` : ''}`
      : null;

    return (
      /* Solid chrome, clean white ground, sealed: an official document. */
      <span className={cn(base, 'border border-ink bg-paper', className)}>
        <SealMark />
        Past paper
        {ref ? <span>· {ref}</span> : null}
      </span>
    );
  }

  return (
    /* Dashed chrome on a dithered ground: written by us, sat by nobody. */
    <span className={cn(base, 'dither-25 border border-dashed border-ink', className)}>
      <PencilMark />
      {source.type === 'model' ? 'Model question' : 'Adapted'}
    </span>
  );
}

/**
 * How confident we are in the answer key.
 *
 * This appears wherever an answer is revealed. Marking schemes are held for
 * only some years, so the distinction is real and load-bearing: "checked
 * against the official marking scheme" must never be shown for an answer our
 * own panel worked out.
 */
export function AnswerConfidenceNote({
  confidence,
}: {
  confidence: 'official_key' | 'expert_verified' | 'unverified';
}) {
  if (confidence === 'unverified') return null;

  const text =
    confidence === 'official_key'
      ? 'Answer checked against the official marking scheme.'
      : 'Answer verified by our review panel.';

  return (
    <p className="flex items-start gap-2 text-[13px] leading-snug">
      <SealMark className="mt-0.5" />
      <span>{text}</span>
    </p>
  );
}

/* --- marks: pixel cells, same grid as the icon family --- */

function SealMark({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      <rect x="0" y="0" width="12" height="2" />
      <rect x="0" y="10" width="12" height="2" />
      <rect x="0" y="0" width="2" height="12" />
      <rect x="10" y="0" width="2" height="12" />
      <rect x="3" y="6" width="2" height="2" />
      <rect x="4" y="7" width="2" height="1" />
      <rect x="5" y="5" width="2" height="2" />
      <rect x="6" y="4" width="2" height="2" />
      <rect x="7" y="3" width="2" height="2" />
    </svg>
  );
}

function PencilMark() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="8" y="1" width="3" height="3" />
      <rect x="6" y="3" width="2" height="2" />
      <rect x="4" y="5" width="2" height="2" />
      <rect x="2" y="7" width="2" height="2" />
      <rect x="1" y="9" width="2" height="2" />
    </svg>
  );
}
