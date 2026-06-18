import React from 'react';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'white';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3 border-2',
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
  };

  const variantClasses = {
    primary: 'border-blue-600 border-t-transparent',
    secondary: 'border-gray-600 border-t-transparent dark:border-gray-400 dark:border-t-transparent',
    white: 'border-white border-t-transparent',
  };

  return (
    <div
      role="status"
      aria-label="loading"
      className={`animate-spin rounded-full border-solid ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
