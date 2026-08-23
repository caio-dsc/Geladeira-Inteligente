import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border border-dashed border-emerald-500/20 bg-[#081d12]/60 backdrop-blur-md">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          {icon}
        </div>
      )}
      <h4 className="text-base font-bold text-white mb-1">{title}</h4>
      <p className="text-xs sm:text-sm text-emerald-300/70 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" variant="primary" leftIcon={actionIcon}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
