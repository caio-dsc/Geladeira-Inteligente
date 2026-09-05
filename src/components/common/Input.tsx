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
        <label htmlFor={generatedId} className="block text-xs font-semibold text-text-primary/90">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-text-secondary/70">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={generatedId}
          className={`w-full rounded-xl border bg-surface px-3.5 py-2.5 min-h-[40px] text-sm text-text-primary placeholder:text-text-secondary/50 transition-all duration-150 focus:outline-hidden focus:ring-3 ${
            leftIcon ? 'pl-10' : ''
          } ${rightIcon ? 'pr-10' : ''} ${
            error
              ? 'border-danger focus:border-danger focus:ring-danger/15'
              : 'border-border hover:border-primary/40 focus:border-primary focus:ring-primary/15 shadow-subtle'
          } ${className}`}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3.5 flex items-center text-text-secondary/70">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-danger font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-text-secondary">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';

