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
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-linear-to-r from-emerald-500 via-emerald-400 to-emerald-500 bg-size-200 hover:bg-right text-stone-950 font-bold shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_25px_rgba(52,211,153,0.5)] border border-emerald-300/40',
    secondary: 'bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-200 border border-emerald-500/30 hover:border-emerald-400/50 shadow-sm backdrop-blur-md',
    outline: 'bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300 hover:text-white border border-emerald-500/30 hover:border-emerald-400 shadow-2xs backdrop-blur-xs',
    danger: 'bg-rose-950/70 hover:bg-rose-900/90 text-rose-200 border border-rose-500/40 hover:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]',
    ghost: 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40',
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
