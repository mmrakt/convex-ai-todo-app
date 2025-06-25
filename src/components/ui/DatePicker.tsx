import { forwardRef } from 'react';

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  label?: string;
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className = '', size = 'md', error, label, ...props }, ref) => {
    const baseClasses =
      'block w-full rounded-md border shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50';

    const sizeClasses = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-3',
      lg: 'h-12 px-4 text-lg',
    };

    const errorClasses = error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-700'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:focus:border-blue-400';

    const backgroundClasses = 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          type="date"
          className={`${baseClasses} ${sizeClasses[size]} ${errorClasses} ${backgroundClasses} ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  },
);

DatePicker.displayName = 'DatePicker';

export const formatDateForInput = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

export const parseDateFromInput = (dateString: string): number => {
  const date = new Date(dateString);
  return date.getTime();
};

export { DatePicker };
