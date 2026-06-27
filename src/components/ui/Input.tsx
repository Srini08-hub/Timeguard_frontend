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
                ? 'text-gray-400 dark:text-gray-600'
                : 'text-gray-700 dark:text-gray-200'
            }`}
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
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
            className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-hidden focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-950 dark:text-gray-50
              ${
                error
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : 'border-gray-300 dark:border-gray-705 focus-visible:ring-blue-500'
              }
              ${icon && iconPosition === 'left' ? 'pl-10' : ''}
              ${icon && iconPosition === 'right' ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />

          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
              {icon}
            </div>
          )}
        </div>

        {error ? (
          <p
            id={errorId}
            className="text-xs text-red-550 dark:text-red-400 font-medium"
            role="alert"
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={helperId}
            className="text-xs text-gray-500 dark:text-gray-455"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
