import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  PlusCircle, 
  Camera, 
  Sparkles, 
  Filter, 
  ChefHat, 
  BookOpen, 
  User, 
  CheckCircle2,
  Salad,
  Apple,
  Package,
  Egg,
  Lightbulb,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { Button } from './Button';

export interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickGuideModal: React.FC<QuickGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const TOTAL_STEPS = 8;

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    onClose();
    // Reset back to step 0 for future voluntary re-openings
    setTimeout(() => setCurrentStep(0), 300);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden sm:overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-guide-title"
      >
        {/* Backdrop escurecido discretamente com Spatial UI */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleComplete}
          className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        />

        {/* Card Elevado do Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg max-h-[calc(100dvh-1.5rem)] sm:max-h-[86vh] flex flex-col bg-surface rounded-2xl sm:rounded-3xl shadow-floating border border-border overflow-hidden z-10 text-text-primary text-left motion-reduce:transform-none"
        >
          {/* Header Fixo */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-surface-muted/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="quick-guide-title" className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                  Guia Rápido
                </h3>
                <p className="text-xs text-text-secondary line-clamp-1">
                  Veja em poucos passos como aproveitar melhor sua Geladeira Inteligente.
                </p>
              </div>
            </div>

            <button
              onClick={handleComplete}
              className="rounded-xl p-2 text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer"
              title="Fechar Guia Rápido"
              aria-label="Fechar Guia Rápido"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Indicador de Progresso Superior */}
          <div className="px-4 sm:px-6 pt-3 pb-1 flex items-center justify-between bg-surface">
            <span className="text-xs font-semibold text-text-secondary">
              Dica <strong className="text-primary">{currentStep + 1}</strong> de {TOTAL_STEPS}
            </span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: TOTAL_STEPS }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    idx === currentStep 
                      ? 'w-5 bg-primary' 
                      : idx < currentStep 
                        ? 'w-2 bg-primary/40' 
                        : 'w-1.5 bg-border'
                  }`}
                  aria-label={`Ir para etapa ${idx + 1}`}
                  title={`Etapa ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Conteúdo Dinâmico Rolável da Etapa */}
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto overscroll-contain text-text-primary">
            {/* ETAPA 1: Adicione seus alimentos */}
            {currentStep === 0 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-text-primary">
                      Adicione seus alimentos
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Cadastre os alimentos que você tem em casa para manter sua geladeira sempre atualizada.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-surface-muted/60 border border-border">
                    <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                      <Salad className="w-4 h-4 text-emerald-600" />
                      Legumes & Verduras
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                      Alface, couve, tomate, cenoura, brócolis...
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-muted/60 border border-border">
                    <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                      <Apple className="w-4 h-4 text-rose-500" />
                      Frutas
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                      Maçã, banana, manga, morango, laranja...
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-muted/60 border border-border">
                    <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                      <Package className="w-4 h-4 text-amber-600" />
                      Despensa
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                      Arroz, feijão, macarrão, farinha, açúcar...
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-muted/60 border border-border">
                    <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                      <Egg className="w-4 h-4 text-amber-500" />
                      Proteínas & Ovos
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                      Frango, carne, peixe, ovos...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 2: Escaneie ou registre */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-text-primary">
                      Escaneie ou registre
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Você pode fotografar seus alimentos para que a IA tente identificá-los ou cadastrá-los manualmente quando preferir.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-muted/60 border border-border space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Dicas práticas para melhorar o reconhecimento:
                  </div>

                  <ul className="space-y-1.5 text-xs text-text-secondary pl-1">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>Fotografe o alimento com boa iluminação;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>Evite ambientes muito escuros;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>Mantenha o alimento visível e relativamente centralizado;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>Evite esconder o alimento atrás de outros objetos;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>Quando possível, fotografe um alimento ou grupo de alimentos claramente identificável;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>Evite fotos muito tremidas ou desfocadas.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* ETAPA 3: Encontre receitas compatíveis */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-text-primary">
                      Encontre receitas compatíveis
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      A Geladeira Inteligente analisa os alimentos disponíveis e mostra receitas que você já consegue preparar ou que estão próximas de ficar completas.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center space-y-2">
                  <div className="text-xs sm:text-sm font-semibold text-text-primary leading-relaxed">
                    “Quanto maior a disponibilidade dos ingredientes, mais preparada está sua geladeira para aquela receita.”
                  </div>
                  <p className="text-xs text-text-secondary">
                    O cálculo considera equivalências comuns de ingredientes para você não desperdiçar nada.
                  </p>
                </div>
              </div>
            )}

            {/* ETAPA 4: Use os filtros */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                    <Filter className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-text-primary">
                      Use os filtros
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Refine suas opções usando filtros como categoria, dificuldade, porções e preferências alimentares para encontrar exatamente o que procura.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-surface-muted/60 border border-border text-center">
                    <span className="text-xs font-bold text-text-primary block">Dietas & Restrições</span>
                    <span className="text-[11px] text-text-secondary">Vegetariano, Sem Glúten, Vegano...</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-muted/60 border border-border text-center">
                    <span className="text-xs font-bold text-text-primary block">Dificuldade</span>
                    <span className="text-[11px] text-text-secondary">Fácil, Médio ou Avançado</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-muted/60 border border-border text-center">
                    <span className="text-xs font-bold text-text-primary block">Porções</span>
                    <span className="text-[11px] text-text-secondary">Ajuste para você ou toda a família</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-muted/60 border border-border text-center">
                    <span className="text-xs font-bold text-text-primary block">Tempo de Preparo</span>
                    <span className="text-[11px] text-text-secondary">Pratos rápidos de 15 a 45 minutos</span>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 5: Veja o que pode preparar */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-text-primary">
                      Veja o que pode preparar
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Descubra rapidamente quais receitas você já pode preparar com os alimentos disponíveis na sua geladeira.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-muted/60 border border-border space-y-2.5">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-emerald-500/20 text-xs">
                    <span className="font-semibold text-text-primary">Prontas para Fazer</span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      100% dos ingredientes
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-amber-500/20 text-xs">
                    <span className="font-semibold text-text-primary">Faltam Poucos Itens</span>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      Falta 1 ou 2 itens
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 6: Abra uma receita */}
            {currentStep === 5 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-text-primary">
                      Abra uma receita
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Abra uma receita para conferir os ingredientes, o nível de disponibilidade, as porções e o passo a passo do preparo.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-muted/60 border border-border space-y-2 text-xs text-text-secondary">
                  <p>
                    Dentro de cada receita você encontra o tempo estimado, modo de preparo minucioso e tabela com os itens que você já possui destacados em verde.
                  </p>
                  <p className="text-text-primary font-medium">
                    Tudo pensado para descomplicar seu dia a dia na cozinha.
                  </p>
                </div>
              </div>
            )}

            {/* ETAPA 7: Personalize seu perfil */}
            {currentStep === 6 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-text-primary">
                      Personalize seu perfil
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      No seu perfil, você pode atualizar suas informações pessoais e deixar sua conta com a sua cara.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-muted/60 border border-border">
                  <span className="text-xs font-bold text-text-primary block mb-2">
                    O que você pode personalizar:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs text-text-secondary">
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-surface border border-border">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Alterar a foto do perfil</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-surface border border-border">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Alterar o nome</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-surface border border-border">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Atualizar idade</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-surface border border-border">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Atualizar altura (cm)</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-surface border border-border">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Atualizar peso (kg)</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-surface border border-border">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Preferências dietéticas</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 8: Tudo pronto! */}
            {currentStep === 7 && (
              <div className="space-y-4 animate-in fade-in duration-200 text-center py-2">
                <div className="w-14 h-14 rounded-3xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto shadow-subtle">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-text-primary">
                    Tudo pronto!
                  </h4>
                  <p className="text-xs sm:text-sm text-text-secondary mt-1.5 max-w-sm mx-auto leading-relaxed">
                    Agora você já sabe o essencial. Explore sua geladeira, descubra novas receitas e aproveite melhor os alimentos que já tem em casa.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-surface-muted/50 border border-border text-xs text-text-secondary max-w-xs mx-auto">
                  Você sempre poderá rever essas dicas quando desejar.
                </div>
              </div>
            )}
          </div>

          {/* Footer com Botões de Navegação */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 border-t border-border bg-surface-muted/40 shrink-0">
            {/* Botão Voltar */}
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
              className={currentStep === 0 ? 'invisible' : ''}
            >
              Voltar
            </Button>

            {/* Botão Avançar / Começar */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleNext}
              rightIcon={currentStep === TOTAL_STEPS - 1 ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              className="font-bold min-w-[110px]"
            >
              {currentStep === TOTAL_STEPS - 1 ? 'Começar' : 'Próxima dica'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
