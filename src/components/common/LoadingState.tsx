import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  fullscreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Carregando...',
  subMessage,
  fullscreen = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="relative flex items-center justify-center w-16 h-16 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping opacity-75" />
        <div className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
        </div>
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
      </div>
      <p className="text-sm font-bold text-text-primary">{message}</p>
      {subMessage && (
        <p className="text-xs text-text-secondary mt-1 max-w-xs">{subMessage}</p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 backdrop-blur-xs">
        <div className="bg-surface rounded-2xl border border-border shadow-floating max-w-sm w-full mx-4">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
