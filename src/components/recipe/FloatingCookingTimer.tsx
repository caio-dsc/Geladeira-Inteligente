import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  X, 
  CheckCircle2, 
  CookingPot,
  RotateCcw
} from 'lucide-react';

export interface FloatingCookingTimerProps {
  recipeTitle: string;
  remainingSeconds: number;
  totalSeconds: number;
  isRunning: boolean;
  isCompleted: boolean;
  onTogglePause: () => void;
  onCancel: () => void;
  onRestart?: () => void;
  onClickRecipe?: () => void;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const FloatingCookingTimer: React.FC<FloatingCookingTimerProps> = ({
  recipeTitle,
  remainingSeconds,
  totalSeconds,
  isRunning,
  isCompleted,
  onTogglePause,
  onCancel,
  onRestart,
  onClickRecipe,
}) => {
  const percentElapsed = totalSeconds > 0 
    ? Math.min(100, Math.max(0, ((totalSeconds - remainingSeconds) / totalSeconds) * 100))
    : 0;

  return (
    <AnimatePresence>
      <motion.aside
        aria-label="Temporizador de receita em andamento"
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40 w-[calc(100vw-1.5rem)] sm:w-80 max-w-[340px] select-none motion-reduce:transform-none"
      >
        <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-surface/95 backdrop-blur-md border border-border shadow-floating text-left flex flex-col gap-2.5 transition-all duration-200">
          {/* Top Bar: Recipe name & Close */}
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
            <button
              onClick={onClickRecipe}
              className="flex items-center gap-2 text-left group min-w-0 cursor-pointer"
              title="Clique para ver a receita"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <CookingPot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
                  Em Preparo
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-text-primary truncate group-hover:text-primary transition-colors">
                  {recipeTitle}
                </h4>
              </div>
            </button>

            <button
              onClick={onCancel}
              className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer shrink-0"
              title="Encerrar temporizador"
              aria-label="Encerrar temporizador"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Center Body: Countdown or Completion */}
          <div className="flex items-center justify-between gap-3 pt-0.5">
            {isCompleted ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-800 shrink-0" />
                <div>
                  <span className="text-xs font-black text-emerald-800 tracking-wide uppercase">
                    Tempo concluído!
                  </span>
                  <span className="text-[11px] text-text-secondary block">
                    Seu prato está pronto para servir.
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                  {formatTime(remainingSeconds)}
                </span>
                <span className="text-[10px] font-semibold text-text-secondary">
                  {isRunning ? 'restando' : 'pausado'}
                </span>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              {isCompleted ? (
                onRestart && (
                  <button
                    onClick={onRestart}
                    className="p-2 rounded-xl bg-surface-muted hover:bg-border text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                    title="Reiniciar tempo"
                    aria-label="Reiniciar tempo"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )
              ) : (
                <button
                  onClick={onTogglePause}
                  className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                    isRunning
                      ? 'bg-amber-500/15 text-amber-900 hover:bg-amber-500/25 border border-amber-500/30'
                      : 'bg-primary text-white hover:bg-primary-dark shadow-subtle'
                  }`}
                  title={isRunning ? 'Pausar' : 'Continuar'}
                  aria-label={isRunning ? 'Pausar temporizador' : 'Continuar temporizador'}
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {!isCompleted && (
            <div className="w-full bg-surface-muted h-1.5 rounded-full overflow-hidden border border-border/40">
              <div 
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${percentElapsed}%` }}
              />
            </div>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
