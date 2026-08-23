import React from 'react';
import { RecipeMatch } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { 
  Clock, 
  ChefHat, 
  Users, 
  Flame, 
  CheckCircle2, 
  XCircle, 
  CookingPot,
  Sparkles
} from 'lucide-react';

export interface RecipeDetailModalProps {
  recipe: RecipeMatch | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  isOpen,
  onClose,
}) => {
  if (!recipe) return null;

  const isFullMatch = recipe.matchPercentage === 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={recipe.title}
      subtitle={`${recipe.category} • ${recipe.prepTimeMinutes} minutos`}
      maxWidth="lg"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="text-xs text-emerald-300/70 hidden sm:block">
            {recipe.matchedIngredients.length} de {recipe.ingredients.length} ingredientes na sua geladeira
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button
              variant="primary"
              leftIcon={<CookingPot className="w-4 h-4" />}
              onClick={() => {
                alert(`Iniciando o preparo de "${recipe.title}"! Bom apetite!`);
                onClose();
              }}
            >
              Começar a Cozinhar
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Banner with image and key stats */}
        <div className="relative rounded-2xl overflow-hidden aspect-16/9 bg-[#07190f] shadow-lg border border-emerald-500/20">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06140c] via-[#06140c]/40 to-transparent" />
          
          <div className="absolute bottom-4 left-4 right-4 text-white flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {recipe.tags.map((tag) => (
                  <span key={tag} className="text-[11px] bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 backdrop-blur-md px-2.5 py-0.5 rounded-md font-bold">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/90 line-clamp-2 max-w-xl">
                {recipe.description}
              </p>
            </div>

            <div className={`px-3 py-1.5 rounded-xl font-extrabold text-xs backdrop-blur-md ${
              isFullMatch ? 'bg-emerald-500 text-stone-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-amber-500/90 text-stone-950'
            }`}>
              {recipe.matchPercentage}% Compatível
            </div>
          </div>
        </div>

        {/* Quick metrics bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-[#081e13] rounded-2xl border border-emerald-500/20 text-center">
            <Clock className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-xs text-emerald-300/60">Tempo</div>
            <div className="text-sm font-bold text-white">{recipe.prepTimeMinutes} min</div>
          </div>

          <div className="p-3 bg-[#081e13] rounded-2xl border border-emerald-500/20 text-center">
            <ChefHat className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-xs text-emerald-300/60">Dificuldade</div>
            <div className="text-sm font-bold text-white">{recipe.difficulty}</div>
          </div>

          <div className="p-3 bg-[#081e13] rounded-2xl border border-emerald-500/20 text-center">
            <Users className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-xs text-emerald-300/60">Rendimento</div>
            <div className="text-sm font-bold text-white">{recipe.servings} porções</div>
          </div>

          <div className="p-3 bg-[#081e13] rounded-2xl border border-emerald-500/20 text-center">
            <Flame className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-xs text-emerald-300/60">Calorias</div>
            <div className="text-sm font-bold text-white">{recipe.caloriesPerServing || 250} kcal</div>
          </div>
        </div>

        {/* Ingredients Checklist */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Ingredientes Necessários</span>
            <span className="text-xs font-normal text-emerald-300/70">
              ({recipe.matchedIngredients.length}/{recipe.ingredients.length} disponíveis)
            </span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recipe.ingredients.map((ing, idx) => {
              const hasIngredient = recipe.matchedIngredients.some(
                (m) => m.toLowerCase().includes(ing.name.toLowerCase()) || ing.name.toLowerCase().includes(m.toLowerCase())
              );

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                    hasIngredient
                      ? 'bg-[#092416] border-emerald-500/30 text-emerald-200'
                      : 'bg-[#180f12] border-rose-500/25 text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {hasIngredient ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="font-semibold text-white">{ing.name}</span>
                  </div>
                  <span className="text-emerald-300/80 font-medium">
                    {ing.quantity} {ing.unit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white">Modo de Preparo</h4>
          <ol className="space-y-2.5">
            {recipe.instructions.map((step, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#081e13] border border-emerald-500/15 text-xs sm:text-sm text-emerald-100 leading-relaxed"
              >
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-extrabold flex items-center justify-center shrink-0 text-xs shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Modal>
  );
};
