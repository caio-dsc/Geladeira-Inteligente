import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}, ref) => {
  const generatedId = id || `input-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label htmlFor={generatedId} className="block text-xs font-semibold text-emerald-200/90">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-emerald-400/70">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={generatedId}
          className={`w-full rounded-2xl border bg-[#081d12]/90 px-4 py-2.5 text-sm text-white placeholder:text-emerald-700/80 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400/30 backdrop-blur-md ${
            leftIcon ? 'pl-10' : ''
          } ${rightIcon ? 'pr-10' : ''} ${
            error
              ? 'border-rose-500/60 focus:border-rose-400 focus:ring-rose-500/20'
              : 'border-emerald-500/25 focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.25)]'
          } ${className}`}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3.5 flex items-center text-emerald-400/70">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-rose-400 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-emerald-400/60">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
