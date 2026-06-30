import React from 'react';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-main)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variantClasses = {
    primary: 'border border-transparent bg-[var(--primary)] text-white shadow-sm shadow-blue-700/15 hover:bg-[var(--primary-hover)]',
    secondary: 'border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-sm shadow-gray-950/5 hover:bg-[var(--bg-card-soft)] hover:text-[var(--text-primary)]',
    danger: 'border border-red-600 bg-red-600 text-white shadow-sm shadow-red-700/15 hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-[var(--border-color)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--primary)] hover:bg-[var(--primary-soft)] hover:text-[var(--text-primary)]',
    ghost: 'border border-transparent bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-card-soft)] hover:text-[var(--text-primary)]',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
    icon: 'h-10 w-10 p-0 text-sm',
  };

  const spinnerVariant = variant === 'primary' || variant === 'danger' ? 'white' : 'secondary';
  const isBtnDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isBtnDisabled}
      aria-busy={isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {isLoading && (
        <Spinner size={size === 'lg' ? 'md' : 'sm'} variant={spinnerVariant} />
      )}

      {!isLoading && icon && iconPosition === 'left' && (
        <span className="flex shrink-0">{icon}</span>
      )}

      {children && <span>{children}</span>}

      {!isLoading && icon && iconPosition === 'right' && (
        <span className="flex shrink-0">{icon}</span>
      )}
    </button>
  );
};
