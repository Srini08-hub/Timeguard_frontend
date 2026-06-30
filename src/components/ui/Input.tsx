import React, { useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className={`${fullWidth ? 'w-full' : 'w-auto'} flex flex-col gap-1.5`}>
        {label && (
          <label
            htmlFor={inputId}
            className={`text-sm font-medium leading-none ${
              disabled
                ? 'text-[var(--text-muted)] opacity-60'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[var(--text-muted)]">
              {icon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={`flex h-10 w-full rounded-md border bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-sm shadow-gray-950/5 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--text-muted)] focus-visible:outline-hidden focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50
              ${
                error
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : 'border-[var(--border-color)] focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]'
              }
              ${icon && iconPosition === 'left' ? 'pl-10' : ''}
              ${icon && iconPosition === 'right' ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />

          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 flex items-center pointer-events-none text-[var(--text-muted)]">
              {icon}
            </div>
          )}
        </div>

        {error ? (
          <p
            id={errorId}
            className="text-xs text-[var(--danger-text)] font-medium"
            role="alert"
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={helperId}
            className="text-xs text-[var(--text-muted)]"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
