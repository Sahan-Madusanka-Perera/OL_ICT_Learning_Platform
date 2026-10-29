import { cn } from '@/lib/utils/cn';
import { ChipMark } from '@/components/ui/icon';

/**
 * The brand tile: the chip mark in an ink square, the reference's corner logo.
 * Used by every frame — student, marketing, auth, admin — so the product has
 * one face wherever a student meets it.
 */
export function BrandTile({ size = 'md', className }: { size?: 'sm' | 'md'; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center bg-accent text-accent-ink',
        'shadow-[0_1px_0_0_rgba(255,255,255,0.14)_inset,0_12px_28px_-12px_var(--shade-strong)]',
        size === 'md' ? 'h-12 w-12 rounded-tile' : 'h-10 w-10 rounded-[13px]',
        className,
      )}
    >
      <ChipMark size={size === 'md' ? 24 : 20} />
    </span>
  );
}
