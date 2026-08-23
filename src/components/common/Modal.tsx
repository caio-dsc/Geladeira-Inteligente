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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
            className={`relative w-full ${maxWidthStyles[maxWidth]} bg-[#081e13]/95 backdrop-blur-2xl rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-emerald-500/30 overflow-hidden z-10 my-auto text-emerald-50`}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            {(title || subtitle) && (
              <div className="flex items-start justify-between p-5 sm:p-6 border-b border-emerald-500/15 bg-emerald-950/40">
                <div>
                  {title && <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>}
                  {subtitle && <p className="text-xs text-emerald-300/70 mt-0.5">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-2 text-emerald-400/80 hover:text-white hover:bg-emerald-800/40 transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-emerald-500/15 bg-emerald-950/50">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
