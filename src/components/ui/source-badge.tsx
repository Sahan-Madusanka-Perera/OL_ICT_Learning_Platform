import { cn } from '@/lib/utils/cn';
import { Pill } from '@/components/ui/window';
import { SealIcon, PencilIcon } from '@/components/ui/icon';

/**
 * Provenance badges.
 *
 * The brief is explicit: a model question must never be mistakable for an
 * authentic examination question. So these two differ on four axes at once —
 * mark (seal against pencil), ground (brass wash against plain), outline
 * (solid against dashed), and wording. Any one of those alone would be a
 * convention a tired student has to have learnt; four together are legible the
 * first time.
 *
 * Apricot rather than the ink accent is deliberate. Ink means "this is the
 * live thing, act on it"; provenance is a fact about the question's origin and
 * must not read as an instruction.
 */

type Source = {
  type: 'past_paper' | 'model' | 'textbook_adapted';
  paper: { year: number; sitting: string; paperNo: number } | null;
  questionNumber: number | null;
};

export function SourceBadge({ source, className }: { source: Source; className?: string }) {
  if (source.type === 'past_paper') {
    const ref = source.paper
      ? `${source.paper.year} · P${source.paper.paperNo}${
          source.questionNumber ? ` Q${source.questionNumber}` : ''
        }`
      : null;

    return (
      /* Sealed and solid: a document that was actually sat. */
      <Pill tone="brass" className={className}>
        <SealIcon size={14} />
        Past paper
        {ref ? <span className="font-mono text-[12px] opacity-85">{ref}</span> : null}
      </Pill>
    );
  }

  return (
    /* Pencilled and dashed: written by us, sat by nobody. */
    <Pill
      tone="neutral"
      className={cn('border border-dashed border-faint/70 bg-transparent text-muted', className)}
    >
      <PencilIcon size={14} />
      {source.type === 'model' ? 'Model question' : 'Adapted'}
    </Pill>
  );
}

/**
 * How confident we are in the answer key.
 *
 * This appears wherever an answer is revealed. Official marking schemes are
 * held for only some years, so the distinction is real and load-bearing:
 * "checked against the official marking scheme" must never be shown for an
 * answer our own panel worked out.
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
    <p className="flex items-start gap-2 text-[13px] leading-snug text-muted">
      <SealIcon size={14} className="mt-px shrink-0 text-brass" />
      <span>{text}</span>
    </p>
  );
}
