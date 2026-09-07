import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  PlusCircle, 
  Sparkles, 
  Filter, 
  CheckCircle2, 
  BookOpen, 
  X, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

export interface HowItWorksGuideProps {
  onNavigateToScanner?: () => void;
  onNavigateToInventory?: () => void;
  onNavigateToRecipes?: () => void;
  onOpenAddModal?: () => void;
  initialCollapsed?: boolean;
}

export const HowItWorksGuide: React.FC<HowItWorksGuideProps> = ({
  onNavigateToScanner,
  onNavigateToInventory,
  onNavigateToRecipes,
  onOpenAddModal,
  initialCollapsed = false,
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('geladeira_guide_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const [isExpanded, setIsExpanded] = useState<boolean>(!initialCollapsed);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem('geladeira_guide_dismissed', 'true');
    } catch {
      // ignore
    }
  };

  const handleRestore = () => {
    setIsDismissed(false);
    setIsExpanded(true);
    try {
      localStorage.removeItem('geladeira_guide_dismissed');
    } catch {
      // ignore
    }
  };

  if (isDismissed) {
    return (
      <div className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-border text-xs text-text-secondary shadow-subtle">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" />
          <span className="font-medium text-text-primary">Novo por aqui?</span>
          <span>Veja o passo a passo da Geladeira Inteligente.</span>
        </div>
        <button
          onClick={handleRestore}
          className="text-xs font-bold text-primary hover:text-primary-dark transition-colors cursor-pointer"
        >
          Ver como funciona
        </button>
      </div>
    );
  }

  const steps = [
    {
      number: '1',
      title: 'Adicione seus alimentos',
      description: 'Mantenha os itens da sua despensa e geladeira cadastrados no sistema.',
      icon: <PlusCircle className="w-4 h-4 text-primary" />,
      action: onOpenAddModal ? { label: 'Adicionar', onClick: onOpenAddModal } : undefined,
    },
    {
      number: '2',
      title: 'Escaneie ou registre',
      description: 'Fotografe prateleiras inteiras com a câmera ou adicione manualmente em segundos.',
      icon: <Camera className="w-4 h-4 text-primary" />,
      action: onNavigateToScanner ? { label: 'Escanear', onClick: onNavigateToScanner } : undefined,
    },
    {
      number: '3',
      title: 'Encontre receitas compatíveis',
      description: 'Nosso algoritmo calcula receitas em tempo real com base no que você já tem.',
      icon: <Sparkles className="w-4 h-4 text-primary" />,
    },
    {
      number: '4',
      title: 'Use os filtros',
      description: 'Refine por categorias, tempo de preparo, dificuldade e dietas (vegano, sem glúten, etc.).',
      icon: <Filter className="w-4 h-4 text-primary" />,
    },
    {
      number: '5',
      title: 'Veja o que pode preparar',
      description: 'Identifique pratos 100% prontos ou descubra os poucos ingredientes que faltam.',
      icon: <CheckCircle2 className="w-4 h-4 text-primary" />,
    },
    {
      number: '6',
      title: 'Abra uma receita',
      description: 'Siga o modo de preparo passo a passo detalhado e cozinhe com praticidade.',
      icon: <BookOpen className="w-4 h-4 text-primary" />,
      action: onNavigateToRecipes ? { label: 'Ver Receitas', onClick: onNavigateToRecipes } : undefined,
    },
  ];

  return (
    <Card variant="default" padding="none" className="overflow-hidden border-border shadow-subtle text-left">
      <div className="p-4 sm:p-5 flex items-center justify-between bg-surface-muted/50 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              Como Funciona a Geladeira Inteligente
            </h3>
            <p className="text-xs text-text-secondary">
              6 passos simples para aproveitar ao máximo seus ingredientes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            title={isExpanded ? 'Recolher guia' : 'Expandir guia'}
            aria-label={isExpanded ? 'Recolher guia' : 'Expandir guia'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg hover:bg-surface text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            title="Dispensar guia"
            aria-label="Dispensar guia"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-6 bg-surface">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className="p-3.5 rounded-2xl bg-surface-muted/40 border border-border flex flex-col justify-between hover:border-primary/30 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center border border-primary/20">
                      {step.number}
                    </span>
                    <div className="p-1 rounded-md bg-surface text-primary shadow-subtle group-hover:scale-110 transition-transform">
                      {step.icon}
                    </div>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                    {step.title}
                  </h4>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {step.action && (
                  <button
                    onClick={step.action.onClick}
                    className="mt-3 text-[11px] font-bold text-primary hover:text-primary-dark flex items-center gap-1 cursor-pointer self-start"
                  >
                    <span>{step.action.label}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-text-secondary">
            <span>Você pode consultar este guia a qualquer momento.</span>
            <button
              onClick={handleDismiss}
              className="text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer"
            >
              Entendido, dispensar
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};
