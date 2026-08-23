import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'interactive' | 'accent' | 'glow';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-3xl transition-all duration-200';

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-7',
  };

  const variantStyles = {
    default: 'bg-[#0b2116]/80 backdrop-blur-xl border border-emerald-500/20 text-emerald-100 shadow-[0_4px_24px_rgba(0,0,0,0.4)]',
    flat: 'bg-[#081a11]/90 border border-emerald-500/15 text-emerald-100',
    interactive: 'bg-[#0b2116]/80 backdrop-blur-xl border border-emerald-500/20 hover:border-emerald-400/50 hover:bg-[#0e2c1d]/90 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] cursor-pointer text-emerald-100 active:scale-[0.99]',
    accent: 'bg-linear-to-br from-emerald-900/90 via-[#0a2717] to-emerald-950 text-white border border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)]',
    glow: 'bg-[#0c281b]/90 backdrop-blur-xl border border-emerald-400/40 text-white shadow-[0_0_30px_rgba(16,185,129,0.35)]',
  };

  return (
    <div
      className={`${baseStyles} ${paddingStyles[padding]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
