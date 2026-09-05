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
  const baseStyles = 'rounded-2xl transition-all duration-200 text-left';

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-7',
  };

  const variantStyles = {
    default: 'bg-surface border border-border text-text-primary shadow-subtle',
    flat: 'bg-surface-muted/70 border border-border text-text-primary',
    interactive: 'bg-surface border border-border hover:border-primary/40 hover:shadow-soft cursor-pointer text-text-primary active:scale-[0.995]',
    accent: 'bg-linear-to-br from-surface via-surface to-surface-muted text-text-primary border border-primary/30 shadow-soft',
    glow: 'bg-surface border border-primary/30 text-text-primary shadow-[0_4px_20px_-2px_rgba(22,160,133,0.15)]',
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

