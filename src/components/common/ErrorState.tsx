import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  disabled?: boolean;
  retryDisabled?: boolean;
  retryHint?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Ocorreu um erro',
  message = 'Não foi possível carregar os dados no momento.',
  onRetry,
  retryLabel = 'Tentar novamente',
  disabled = false,
  retryDisabled,
  retryHint,
}) => {
  const isRetryDisabled = retryDisabled !== undefined ? retryDisabled : disabled;

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center rounded-2xl sm:rounded-3xl border border-danger/30 bg-red-50/40 shadow-subtle">
      <div className="w-14 h-14 rounded-2xl bg-red-100 text-danger flex items-center justify-center mb-3.5 border border-danger/20">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h4 className="text-base font-bold text-text-primary mb-1">{title}</h4>
      <p className="text-xs sm:text-sm text-text-secondary max-w-sm mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <div className="flex flex-col items-center gap-2">
          <Button
            onClick={onRetry}
            disabled={isRetryDisabled}
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            {retryLabel}
          </Button>
          {retryHint && (
            <span className="text-xs text-text-secondary/70 font-medium">
              {retryHint}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
