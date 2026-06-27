import React from 'react';

export interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
}) => {
  const variantClasses = {
    success: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-950/35 dark:text-green-400 dark:ring-green-500/25',
    warning: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/35 dark:text-amber-400 dark:ring-amber-500/25',
    danger: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/35 dark:text-red-400 dark:ring-red-500/25',
    info: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/35 dark:text-blue-400 dark:ring-blue-500/25',
    neutral: 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-800/40 dark:text-gray-400 dark:ring-gray-700/30',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
