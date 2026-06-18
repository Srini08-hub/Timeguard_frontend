import React, { useId } from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[] | string[];
  fullWidth?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      fullWidth = false,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    const normalizedOptions = options.map((opt) =>
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    );

    return (
      <div className={`${fullWidth ? 'w-full' : 'w-auto'} flex flex-col gap-1.5`}>
        {label && (
          <label
            htmlFor={selectId}
            className={`text-sm font-medium leading-none ${
              disabled
                ? 'text-gray-400 dark:text-gray-600'
                : 'text-gray-750 dark:text-gray-250'
            }`}
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors focus-visible:outline-hidden focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-950 dark:text-gray-50 appearance-none cursor-pointer pr-10
              ${
                error
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : 'border-gray-300 dark:border-gray-705 focus-visible:ring-blue-500'
              }
              ${className}
            `}
            {...props}
          >
            {normalizedOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute right-3 pointer-events-none text-gray-450 dark:text-gray-500">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
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

Select.displayName = 'Select';
