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
      className={`inline-flex items-center font-semibold rounded-full transition-all duration-200 backdrop-blur-md ${sizeClasses} ${
        isLow 
          ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40 hover:bg-amber-900/60 hover:border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]' 
          : 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/35 hover:bg-emerald-900/80 hover:border-emerald-400/70 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
      } ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'}`}
      title="Créditos disponíveis para escaneamento"
    >
      <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <Sparkles className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-emerald-400 shrink-0`} />
      </div>
      <span className="font-extrabold text-white">{credits}</span>
      <span className="text-emerald-300/80 hidden xs:inline">{credits === 1 ? 'crédito' : 'créditos'}</span>
    </button>
  );
};
