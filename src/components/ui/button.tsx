import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Controls, in a world with two states.
 *
 * `primary` IS the inversion — solid black ground, white ink. It is the
 * loudest thing the system owns, so a viewport gets one. Pressing any
 * control inverts it for the duration of the press, which means the primary
 * flips back to white: the press is always a state change you can see.
 *
 * Disabled is carried by pattern, not by opacity: a 25% dither ground and
 * chrome dropped to a dashed line. Opacity would manufacture a grey, and
 * there are no greys here.
 *
 * The label keeps its own paper inside that ground — DESIGN.md §4 puts the
 * dither over the control and §1 says content never sits on a dither, and
 * both hold at once only if the ground is dithered and the words are not.
 * Neither density alone survives a 2px Silkscreen stem; a knocked-out plate
 * does, at any density.
 */
const button = cva(
  'font-pixel ant-focus inline-flex select-none items-center justify-center gap-2 ' +
    'border border-ink text-center uppercase leading-tight transition-none ' +
    'disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary:
          'bg-ink text-paper active:bg-paper active:text-ink ' +
          'disabled:dither-25 disabled:border-dashed disabled:text-ink',
        secondary:
          'bg-paper text-ink hover:bg-ink hover:text-paper active:bg-paper active:text-ink ' +
          'disabled:dither-25 disabled:border-dashed disabled:text-ink disabled:hover:text-ink',
        ghost:
          'border-transparent bg-transparent text-ink hover:bg-ink hover:text-paper ' +
          'active:bg-paper active:text-ink disabled:border-dashed disabled:border-ink',
      },
      size: {
        /*
         * Whole-pixel heights so the Silkscreen inside stays on its grid,
         * and PRODUCT.md's 56px touch floor is the default rather than the
         * exception: `md` and `lg` both clear it, and `sm` exists only for
         * the mouse-driven admin chrome, never on a student surface.
         */
        sm: 'min-h-11 px-3 py-1.5 text-[16px]',
        md: 'min-h-14 px-4 py-2 text-[16px]',
        lg: 'min-h-16 px-6 py-3 text-[16px]',
        icon: 'h-14 w-14 shrink-0 px-0',
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

    /* Slot forwards to a single child, so only a real button gets the plate. */
    return (
      <Comp ref={ref} className={cn(button({ variant, size, full }), className)} {...props}>
        {asChild ? children : <span className="btn-label">{children}</span>}
      </Comp>
    );
  },
);
Button.displayName = 'Button';
