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
                ? 'text-[var(--text-muted)] opacity-60'
                : 'text-[var(--text-secondary)]'
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
          className={`flex w-full rounded-md border bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-sm shadow-gray-950/5 transition-colors placeholder:text-[var(--text-muted)] focus-visible:outline-hidden focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 resize-y
            ${
              error
                ? 'border-red-500 focus-visible:ring-red-500'
                : 'border-[var(--border-color)] focus-visible:border-[var(--primary)] focus-visible:ring-[var(--primary)]'
            }
            ${className}
          `}
          {...props}
        />

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

Textarea.displayName = 'Textarea';
