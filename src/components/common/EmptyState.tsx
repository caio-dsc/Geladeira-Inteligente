import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  message,
  actionLabel,
  onAction,
  actionIcon,
}) => {
  const text = message || description || '';
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl sm:rounded-3xl border border-dashed border-border bg-surface shadow-subtle">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-surface-muted text-primary flex items-center justify-center mb-4 border border-border">
          {icon}
        </div>
      )}
      <h4 className="text-base font-bold text-text-primary mb-1">{title}</h4>
      {text && <p className="text-xs sm:text-sm text-text-secondary max-w-sm mb-5 leading-relaxed">{text}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" variant="primary" leftIcon={actionIcon}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
