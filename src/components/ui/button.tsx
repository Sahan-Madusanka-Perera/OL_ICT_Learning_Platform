import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Controls.
 *
 * `primary` is the ink pill — solid black by day, chalk white at night — and a
 * viewport gets one of them. The ink means "this is the live thing", so the
 * rest are quieter; a second primary makes the first one a decoration.
 *
 * `secondary` is a white pill with a hairline, the reference's "Weekly ⌄"
 * control. `ghost` is text with a hover ground. `danger` fills on hover.
 *
 * Three details make them objects rather than rectangles: a press that moves
 * (`active:scale-[0.98]` on the settle curve), a shadow that changes with
 * state, and the trailing affordance disc on a primary call to action.
 *
 * Disabled drops to the sunken ground and keeps a hairline, so it reads as an
 * inert control rather than as a hole in the layout.
 */
const button = cva(
  'group relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap ' +
    'rounded-full text-center font-medium leading-none tracking-[-0.01em] ' +
    'transition-[transform,box-shadow,background-color,color] duration-200 ease-[var(--ease-settle)] ' +
    'active:scale-[0.98] disabled:pointer-events-none disabled:active:scale-100',
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-accent-ink ' +
          'shadow-[0_1px_0_0_rgba(255,255,255,0.14)_inset,0_10px_24px_-10px_var(--shade-strong)] ' +
          'hover:bg-accent-hover hover:shadow-[0_1px_0_0_rgba(255,255,255,0.14)_inset,0_14px_30px_-10px_var(--shade-strong)] ' +
          'disabled:bg-sunken disabled:text-faint ' +
          'disabled:shadow-[inset_0_0_0_1px_var(--color-line)]',
        secondary:
          'bg-raised text-ink ' +
          'shadow-[inset_0_0_0_1px_var(--color-line),var(--shadow-raised)] ' +
          'hover:shadow-[inset_0_0_0_1px_var(--color-accent-line),var(--shadow-float)] ' +
          'disabled:bg-sunken disabled:text-faint ' +
          'disabled:shadow-[inset_0_0_0_1px_var(--color-line)]',
        ghost:
          'bg-transparent text-muted hover:bg-sunken hover:text-ink disabled:text-faint',
        danger:
          'bg-wrong-soft text-wrong shadow-[inset_0_0_0_1px_var(--color-wrong)] ' +
          'hover:bg-wrong hover:text-raised disabled:bg-sunken disabled:text-faint ' +
          'disabled:shadow-[inset_0_0_0_1px_var(--color-line)]',
      },
      size: {
        /*
         * `md` and `lg` clear the 48px touch floor from PRODUCT.md. `sm`
         * exists only for mouse-driven admin chrome and never appears on a
         * student surface.
         */
        sm: 'min-h-9 px-4 py-2 text-[13px]',
        md: 'min-h-12 px-6 py-3 text-[15px]',
        lg: 'min-h-14 px-7 py-4 text-[16px]',
        icon: 'h-12 w-12 shrink-0 rounded-tile px-0',
      },
      full: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button> & { asChild?: boolean };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, full, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp ref={ref} className={cn(button({ variant, size, full }), className)} {...props}>
        {children}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

/**
 * The trailing affordance on a primary call to action.
 *
 * The arrow is never left naked beside the label — it sits in its own disc,
 * flush with the button's inner padding, and shifts a pixel or two on hover.
 * That tiny internal movement is what makes the button feel like it has parts
 * that move rather than a glyph printed on it.
 */
export function ButtonAffordance({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        '-mr-3 ml-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
        'bg-current/15 transition-transform duration-300 ease-[var(--ease-settle)]',
        'group-hover:translate-x-0.5 motion-reduce:transform-none',
      )}
    >
      {children}
    </span>
  );
}
