import { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const baseClasses = 'rounded-lg';

    const variantClasses = {
      default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
      outlined: 'border-2 border-gray-300 dark:border-gray-600 bg-transparent',
      elevated: 'bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700',
    };

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`p-6 pb-4 ${className}`} {...props} />
  ),
);

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', ...props }, ref) => (
    <h3
      ref={ref}
      className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`}
      {...props}
    />
  ),
);

CardTitle.displayName = 'CardTitle';

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />
  ),
);

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`p-6 pt-0 flex items-center ${className}`} {...props} />
  ),
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
