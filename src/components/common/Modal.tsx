import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-hidden sm:overflow-y-auto">
          {/* Backdrop com desfoque moderado e tom neutro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Modal Dialog estruturado em flex column com viewport dinâmica e scroll contido */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full ${maxWidthStyles[maxWidth]} max-h-[calc(100dvh-1.25rem)] sm:max-h-[88vh] flex flex-col bg-surface rounded-2xl sm:rounded-3xl shadow-floating border border-border overflow-hidden z-10 text-text-primary text-left`}
            role="dialog"
            aria-modal="true"
          >
            {/* Header fixo */}
            {(title || subtitle) && (
              <div className="flex items-start justify-between p-4 sm:p-5 border-b border-border bg-surface-muted/60 flex-shrink-0">
                <div>
                  {title && <h3 className="text-lg font-bold text-text-primary tracking-tight">{title}</h3>}
                  {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-xl p-2 text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Body rolável isolado */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto overscroll-contain text-text-primary">
              {children}
            </div>

            {/* Footer com ações fixas */}
            {footer && (
              <div className="flex items-center justify-end gap-3 p-3.5 sm:p-5 border-t border-border bg-surface-muted/40 flex-shrink-0 mt-auto">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

