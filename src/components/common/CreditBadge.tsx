import React from 'react';
import { Sparkles } from 'lucide-react';

export interface CreditBadgeProps {
  credits: number;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export const CreditBadge: React.FC<CreditBadgeProps> = ({
  credits,
  onClick,
  size = 'md',
}) => {
  const isLow = credits <= 2;

  const sizeClasses = size === 'sm' 
    ? 'px-3 py-1 text-xs gap-1.5' 
    : 'px-3.5 py-1.5 text-xs sm:text-sm gap-2';

  return (
    <button
      onClick={onClick}
      type="button"
      className={`inline-flex items-center font-medium rounded-full transition-all duration-200 ${sizeClasses} ${
        isLow 
          ? 'bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100/80 hover:border-amber-300 shadow-subtle' 
          : 'bg-emerald-50/90 text-emerald-950 border border-emerald-200/80 hover:bg-emerald-100/80 hover:border-emerald-300 shadow-subtle'
      } ${onClick ? 'cursor-pointer hover:-translate-y-0.5 active:translate-y-0' : 'cursor-default'}`}
      title="Créditos disponíveis para escaneamento"
    >
      <div className={`rounded-full flex items-center justify-center ${isLow ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-primary'}`}>
        <Sparkles className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} shrink-0`} />
      </div>
      <span className="font-bold text-text-primary">{credits}</span>
      <span className="text-text-secondary hidden xs:inline">{credits === 1 ? 'crédito' : 'créditos'}</span>
    </button>
  );
};
