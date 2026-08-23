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
        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping opacity-75" />
        <div className="absolute inset-2 rounded-full bg-emerald-500/10 backdrop-blur-md flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
        </div>
        <Loader2 className="w-16 h-16 text-emerald-400 animate-spin" />
      </div>
      <p className="text-sm font-bold text-white drop-shadow-xs">{message}</p>
      {subMessage && (
        <p className="text-xs text-emerald-300/70 mt-1 max-w-xs">{subMessage}</p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05130b]/90 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return content;
};
