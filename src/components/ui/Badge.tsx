import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

type Priority = 'low' | 'medium' | 'high' | 'urgent';
type Status = 'todo' | 'in_progress' | 'completed' | 'on_hold';

export const getPriorityBadgeProps = (priority: Priority) => {
  switch (priority) {
    case 'low':
      return { variant: 'secondary' as const, className: 'text-gray-600 bg-gray-100' };
    case 'medium':
      return { variant: 'default' as const, className: 'text-blue-600 bg-blue-100' };
    case 'high':
      return { variant: 'default' as const, className: 'text-orange-600 bg-orange-100' };
    case 'urgent':
      return { variant: 'destructive' as const };
    default:
      return { variant: 'secondary' as const };
  }
};

export const getStatusBadgeProps = (status: Status) => {
  switch (status) {
    case 'todo':
      return { variant: 'outline' as const, className: 'text-gray-600 border-gray-300' };
    case 'in_progress':
      return { variant: 'default' as const, className: 'text-blue-600 bg-blue-100' };
    case 'completed':
      return { variant: 'default' as const, className: 'text-green-600 bg-green-100' };
    case 'on_hold':
      return { variant: 'secondary' as const, className: 'text-yellow-600 bg-yellow-100' };
    default:
      return { variant: 'outline' as const };
  }
};

export { Badge, badgeVariants };
