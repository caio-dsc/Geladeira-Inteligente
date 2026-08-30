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
    <div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center rounded-3xl border border-rose-500/30 bg-[#1c0a0f]/80 backdrop-blur-md shadow-[0_0_30px_rgba(244,63,94,0.15)]">
      <div className="w-14 h-14 rounded-2xl bg-rose-950 text-rose-400 flex items-center justify-center mb-3.5 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h4 className="text-base font-bold text-white mb-1">{title}</h4>
      <p className="text-xs sm:text-sm text-rose-200/70 max-w-sm mb-4 leading-relaxed">{message}</p>
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
            <span className="text-xs text-rose-300/60 font-medium">
              {retryHint}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
