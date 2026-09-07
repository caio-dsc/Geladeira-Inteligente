import React, { useState } from 'react';
import { HelpCircle, ArrowRight, X } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { QuickGuideModal } from './QuickGuideModal';

export interface HowItWorksGuideProps {
  onOpenQuickGuide?: () => void;
  onNavigateToScanner?: () => void;
  onNavigateToInventory?: () => void;
  onNavigateToRecipes?: () => void;
  onOpenAddModal?: () => void;
  initialCollapsed?: boolean;
}

export const HowItWorksGuide: React.FC<HowItWorksGuideProps> = ({
  onOpenQuickGuide,
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('geladeira_guide_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('geladeira_guide_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  const handleOpen = () => {
    if (onOpenQuickGuide) {
      onOpenQuickGuide();
    } else {
      setIsLocalModalOpen(true);
    }
  };

  if (isDismissed) {
    return (
      <div className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-border text-xs text-text-secondary shadow-subtle">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" />
          <span className="font-medium text-text-primary">Novo por aqui?</span>
          <span>Veja o Guia Rápido da Geladeira Inteligente.</span>
        </div>
        <button
          onClick={handleOpen}
          className="text-xs font-bold text-primary hover:text-primary-dark transition-colors cursor-pointer"
        >
          Ver Guia Rápido
        </button>
      </div>
    );
  }

  return (
    <>
      <Card variant="default" padding="sm" className="border-border shadow-subtle">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-text-primary">
                Guia Rápido da Geladeira Inteligente
              </h4>
              <p className="text-[11px] sm:text-xs text-text-secondary line-clamp-1">
                Veja em poucos passos como aproveitar melhor sua Geladeira Inteligente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpen}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs font-bold flex-1 sm:flex-initial"
            >
              Abrir Guia Rápido
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-xl hover:bg-surface-muted text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              title="Dispensar aviso"
              aria-label="Dispensar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {!onOpenQuickGuide && (
        <QuickGuideModal
          isOpen={isLocalModalOpen}
          onClose={() => setIsLocalModalOpen(false)}
        />
      )}
    </>
  );
};
