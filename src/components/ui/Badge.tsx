import { forwardRef } from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
  size?: 'sm' | 'md';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center rounded-full font-medium';

    const variantClasses = {
      default: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      destructive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };

    const sizeClasses = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';

export const getPriorityBadgeProps = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return { variant: 'destructive' as const, children: 'Urgent' };
    case 'high':
      return { variant: 'warning' as const, children: 'High' };
    case 'medium':
      return { variant: 'default' as const, children: 'Medium' };
    case 'low':
      return { variant: 'secondary' as const, children: 'Low' };
    default:
      return { variant: 'secondary' as const, children: 'Unknown' };
  }
};

export const getStatusBadgeProps = (status: string) => {
  switch (status) {
    case 'completed':
      return { variant: 'success' as const, children: 'Completed' };
    case 'in_progress':
      return { variant: 'default' as const, children: 'In Progress' };
    case 'todo':
      return { variant: 'secondary' as const, children: 'To Do' };
    case 'on_hold':
      return { variant: 'warning' as const, children: 'On Hold' };
    default:
      return { variant: 'secondary' as const, children: 'Unknown' };
  }
};

export { Badge };
