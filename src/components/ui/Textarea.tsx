import React, { useId } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      className = '',
      id,
      disabled,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    return (
      <div className={`${fullWidth ? 'w-full' : 'w-auto'} flex flex-col gap-1.5`}>
        {label && (
          <label
            htmlFor={textareaId}
            className={`text-sm font-medium leading-none ${
              disabled
                ? 'text-gray-400 dark:text-gray-600'
                : 'text-gray-750 dark:text-gray-250'
            }`}
          >
            {label}
          </label>
        )}

        <textarea
          id={textareaId}
          ref={ref}
          disabled={disabled}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          className={`flex w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus-visible:outline-hidden focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-950 dark:text-gray-50 resize-y
            ${
              error
                ? 'border-red-500 focus-visible:ring-red-500'
                : 'border-gray-300 dark:border-gray-705 focus-visible:ring-blue-500'
            }
            ${className}
          `}
          {...props}
        />

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

Textarea.displayName = 'Textarea';
