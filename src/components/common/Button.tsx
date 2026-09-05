import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 select-none';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[32px]',
    md: 'px-4 py-2 text-sm gap-2 min-h-[38px]',
    lg: 'px-5 py-2.5 sm:px-6 sm:py-3 text-base gap-2.5 min-h-[44px]',
  };

  const variantStyles = {
    primary: 'bg-primary hover:bg-[#138a72] active:bg-primary-dark text-white font-bold shadow-subtle hover:shadow-soft border border-primary-dark/15',
    secondary: 'bg-surface-muted hover:bg-[#e4ede8] active:bg-[#d8e5df] text-primary-dark border border-border shadow-subtle',
    outline: 'bg-surface hover:bg-surface-muted active:bg-[#e4ede8] text-text-primary hover:text-primary border border-border hover:border-primary/40 shadow-subtle',
    danger: 'bg-danger hover:bg-[#dc2626] active:bg-[#b91c1c] text-white border border-red-700/20 shadow-subtle hover:shadow-soft',
    ghost: 'bg-transparent hover:bg-surface-muted active:bg-[#e4ede8] text-text-primary hover:text-primary',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

