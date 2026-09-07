import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground',
        green: 'border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        amber: 'border-amber-600/25 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        red: 'border-red-600/25 bg-red-500/10 text-red-700 dark:text-red-400',
        blue: 'border-sky-600/25 bg-sky-500/10 text-sky-700 dark:text-sky-400',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
