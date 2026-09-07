import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helperText,
  leftIcon,
  className = '',
  id,
  children,
  ...props
}, ref) => {
  const generatedId = id || `select-${Math.random().toString(36).substring(2, 7)}`;

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

        <select
          ref={ref}
          id={generatedId}
          className={`w-full rounded-xl border bg-surface px-3.5 py-2.5 pr-10 min-h-[40px] text-sm text-text-primary appearance-none transition-all duration-150 focus:outline-hidden focus:ring-3 cursor-pointer ${
            leftIcon ? 'pl-10' : ''
          } ${
            error
              ? 'border-danger focus:border-danger focus:ring-danger/15'
              : 'border-border hover:border-primary/40 focus:border-primary focus:ring-primary/15 shadow-subtle'
          } ${className}`}
          {...props}
        >
          {children}
        </select>

        <div className="absolute right-3.5 flex items-center pointer-events-none text-text-secondary/60">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="text-xs text-danger font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-text-secondary">{helperText}</p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';
