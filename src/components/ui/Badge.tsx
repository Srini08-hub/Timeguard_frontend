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
    primary: 'bg-[var(--primary-soft)] text-[var(--primary-hover)] ring-blue-200',
    success: 'bg-[var(--success-bg)] text-[var(--success-text)] ring-[var(--success-border)]',
    warning: 'bg-[var(--warning-bg)] text-[var(--warning-text)] ring-amber-200',
    danger: 'bg-[var(--danger-bg)] text-[var(--danger-text)] ring-red-200',
    info: 'bg-[var(--primary-soft)] text-[var(--primary-hover)] ring-blue-200',
    neutral: 'bg-[var(--bg-card-soft)] text-[var(--text-secondary)] ring-[var(--border-color)]',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
