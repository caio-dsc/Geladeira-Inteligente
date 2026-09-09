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
  Milk,
  Egg,
  Coffee,
  Package,
  Flame,
  Croissant,
  HelpCircle,
  Lightbulb,
  Sun
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

  const TOTAL_STEPS = 7;

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
          className="relative w-full max-w-lg max-h-[calc(100dvh-1.5rem)] sm:max-h-[88vh] flex flex-col bg-surface rounded-2xl sm:rounded-3xl shadow-floating border border-border overflow-hidden z-10 text-text-primary text-left motion-reduce:transform-none"
        >
          {/* Header Fixo - Sem truncamento */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-surface-muted/60 shrink-0">
            <div className="flex items-center gap-3 pr-2 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 id="quick-guide-title" className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                  Guia Rápido
                </h3>
                <p className="text-xs text-text-secondary leading-snug">
                  Veja em poucos passos como aproveitar melhor sua Geladeira Inteligente.
                </p>
              </div>
            </div>

            <button
              onClick={handleComplete}
              className="rounded-xl p-2 text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors cursor-pointer shrink-0"
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
            {/* ETAPA 1: Adicionar alimentos (com as 8 categorias explícitas e exemplos) */}
            {currentStep === 0 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-text-primary">
                      1. Adicionar alimentos
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Cadastre os alimentos disponíveis na sua casa organizados pelas categorias abaixo:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-surface-muted/60 border border-border">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                      <Apple className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>Frutas</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1">
                      Maçã, Banana, Manga, Morango, Laranja
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-muted/60 border border-border">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                      <Milk className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>Laticínios</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1">
                      Leite, Queijo, Iogurte, Requeijão, Creme de leite
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-muted/60 border border-border">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                      <Egg className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Proteínas e Ovos</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1">
                      Frango, Carne, Peixe, Ovos
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-muted/60 border border-border">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                      <Coffee className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Bebidas</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1">
                      Água, Suco, Refrigerante, Café, Chá
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-muted/60 border border-border">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                      <Package className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Despensa</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1">
                      Arroz, Feijão, Lentilha, Açúcar, Farinha
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-muted/60 border border-border">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                      <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span>Temperos & Molhos</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1">
                      Sal, Pimenta, Alho, Ketchup, Molho de tomate
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-muted/60 border border-border">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                      <Croissant className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Pães & Massas</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1">
                      Pão, Macarrão, Espaguete, Lasanha, Tapioca
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-muted/60 border border-border">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                      <Salad className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>Outros</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1">
                      Alimentos que não se enquadram nas anteriores.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPA 2: Escaneie ou registre (com dicas práticas de fotografia) */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-text-primary">
                      2. Escaneie ou registre
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Use o Scanner para identificar seus alimentos rapidamente ou registre-os manualmente quando preferir.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-muted/60 border border-border space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <Lightbulb className="w-4 h-4 text-primary shrink-0" />
                    <span>Dicas práticas para fotografar alimentos:</span>
                  </div>

                  <ul className="space-y-2 text-xs text-text-secondary pl-1">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span><strong>Deixe o alimento bem visível:</strong> retire itens que possam obstruir a visão.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span><strong>Prefira boa iluminação:</strong> evite fotos muito escuras ou contraluz forte.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span><strong>Mantenha no enquadramento:</strong> centralize os alimentos na tela da câmera.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span><strong>Grupos pequenos:</strong> quando possível, fotografe um alimento ou grupo pequeno por vez para maior precisão.</span>
                    </li>
                  </ul>

                  <p className="text-[11px] text-text-secondary/80 italic pt-1 border-t border-border">
                    Lembre-se: uma boa fotografia ajuda o reconhecimento inteligente da IA!
                  </p>
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
                      3. Encontre receitas compatíveis
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Encontre receitas que combinam com os alimentos disponíveis na sua geladeira e descubra o que você já pode preparar.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-dark via-[#0B3D35] to-[#082821] text-white shadow-soft border border-primary/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full font-bold">
                      Matching Inteligente
                    </span>
                    <span className="text-emerald-300 font-semibold">Sem desperdício</span>
                  </div>
                  <h5 className="font-bold text-sm sm:text-base text-white">
                    Aproveitamento total dos ingredientes
                  </h5>
                  <p className="text-xs text-white/85 leading-relaxed">
                    O sistema cruza seu estoque em tempo real com centenas de receitas culinárias, priorizando sempre os pratos mais compatíveis com o que você já comprou.
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
                      4. Use os filtros
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Filtre receitas por restrições alimentares, tempo de preparo ou nível de dificuldade.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-muted/60 border border-border space-y-3">
                  <div className="text-xs font-bold text-text-primary">
                    Restrições e preferências suportadas:
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {['Vegetariano', 'Vegano', 'Sem Glúten', 'Sem Lactose', 'Low Carb', 'Sem Frituras', 'Rico em Proteína'].map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg bg-surface border border-border text-[11px] font-semibold text-text-primary shadow-subtle"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed pt-1 border-t border-border">
                    Você também pode filtrar por pratos rápidos (até 15 ou 30 minutos) e por nível de habilidade (Fácil, Médio ou Avançado).
                  </p>
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
                      5. Veja o que pode preparar
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      O sistema calcula a porcentagem de ingredientes que você já tem em casa e destaca com o selo "Pronta para cozinhar" os pratos com 100% dos ingredientes disponíveis.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-muted/60 border border-border space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border shadow-subtle">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-text-primary block">
                        Omelete com Ervas e Queijo
                      </span>
                      <span className="text-[11px] text-text-secondary">
                        4 de 4 ingredientes na geladeira
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      Pronta para cozinhar
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed">
                    Assim você sabe exatamente o que pode fazer na hora sem precisar ir ao supermercado.
                  </p>
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
                      6. Abra uma receita
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Ao selecionar qualquer receita, você vê a lista completa de ingredientes com marcação de quais estão na sua geladeira e o modo de preparo detalhado passo a passo.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-muted/60 border border-border space-y-2.5 text-xs text-text-secondary">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-surface border border-border">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-text-primary font-medium">Itens em verde: você já tem na geladeira</span>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-surface border border-border">
                    <X className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-text-primary font-medium">Itens em vermelho: ingredientes faltantes opcionais</span>
                  </div>

                  <p className="pt-1">
                    Além disso, você pode ativar o botão <strong>Começar a Cozinhar</strong> para ligar o temporizador oficial da receita!
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
                      7. Personalize seu perfil
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      No seu Perfil, você pode atualizar sua foto e suas informações pessoais sempre que quiser.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-muted/60 border border-border space-y-2 text-xs text-text-secondary">
                  <p className="text-text-primary font-semibold">
                    Personalizações disponíveis no seu perfil:
                  </p>
                  <ul className="space-y-1.5 pl-1">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span>Nome e foto de exibição</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span>Medidas corporais (peso e altura para cálculo calórico)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span>Porções padrão de refeição</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span>Restrições alimentares permanentes</span>
                    </li>
                  </ul>
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

            {/* Botão Avançar / Concluir */}
            <Button
              variant="primary"
              size="sm"
              onClick={handleNext}
              rightIcon={currentStep === TOTAL_STEPS - 1 ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              className="font-bold min-w-[110px]"
            >
              {currentStep === TOTAL_STEPS - 1 ? 'Concluir' : 'Próxima dica'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
