import { forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', options, placeholder, size = 'md', error, ...props }, ref) => {
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
        <select
          ref={ref}
          className={`${baseClasses} ${sizeClasses[size]} ${errorClasses} ${backgroundClasses} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  },
);

Select.displayName = 'Select';

export { Select };
