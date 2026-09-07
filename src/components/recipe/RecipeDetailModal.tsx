import React from 'react';
import { RecipeMatch } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { getRecipeDietBadges } from '../../services/recipeService';
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
  const [isCooking, setIsCooking] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setIsCooking(false);
    }
  }, [isOpen]);

  if (!recipe) return null;

  const isFullMatch = recipe.matchPercentage === 100;

  const dietBadges = getRecipeDietBadges(recipe.diet);
  const tags = recipe.tags ?? [];
  const instructions =
    (recipe.steps && recipe.steps.length > 0
      ? recipe.steps
      : (recipe as any).instructions) ?? [];

  const placeholder =
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="#E8EFEA"/>
            <stop offset="1" stop-color="#DFEAE4"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
          fill="#16A085" font-family="Arial" font-size="28" font-weight="700">
          Sem foto
        </text>
      </svg>
    `);

  const imgSrc = recipe.imageUrl?.trim() ? recipe.imageUrl : placeholder;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={recipe.title}
      subtitle={`${recipe.category} • ${recipe.prepTimeMinutes} minutos`}
      maxWidth="lg"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="text-xs text-text-secondary hidden sm:block">
            {recipe.matchedIngredients.length} de {recipe.ingredients.length} ingredientes na sua geladeira
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button
              variant={isCooking ? "secondary" : "primary"}
              leftIcon={<CookingPot className="w-4 h-4" />}
              onClick={() => {
                setIsCooking(true);
              }}
            >
              {isCooking ? 'Modo de Preparo Ativo' : 'Começar a Cozinhar'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 text-left">
        {isCooking && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between gap-2 text-xs font-semibold shadow-subtle animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span>Modo de preparo ativado para "{recipe.title}". Siga o passo a passo abaixo. Bom apetite!</span>
            </div>
            <button
              onClick={() => setIsCooking(false)}
              className="text-text-secondary hover:text-text-primary text-xs underline cursor-pointer shrink-0"
            >
              Concluir
            </button>
          </div>
        )}
        {/* Banner with image and key stats */}
        <div className="relative rounded-2xl overflow-hidden aspect-16/9 bg-surface-muted shadow-soft border border-border">
          <img
            src={imgSrc}
            alt={recipe.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = placeholder;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          
          <div className="absolute bottom-4 left-4 right-4 text-white flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                {dietBadges.map((badge) => (
                  <span
                    key={badge}
                    className="text-[11px] bg-white/20 border border-white/30 text-white backdrop-blur-md px-2.5 py-0.5 rounded-md font-bold"
                  >
                    {badge}
                  </span>
                ))}
                {tags
                  .filter((tag) => !dietBadges.includes(tag))
                  .map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] bg-black/50 border border-white/20 text-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-md font-medium"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
              <p className="text-xs sm:text-sm text-white/90 line-clamp-2 max-w-xl">
                {recipe.description}
              </p>
            </div>

            <div className={`px-3 py-1.5 rounded-xl font-bold text-xs backdrop-blur-md ${
              isFullMatch ? 'bg-primary text-white shadow-subtle' : 'bg-amber-600 text-white'
            }`}>
              {recipe.matchPercentage}% Compatível
            </div>
          </div>
        </div>

        {/* Quick metrics bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-surface-muted/70 rounded-xl sm:rounded-2xl border border-border text-center shadow-subtle">
            <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
            <div className="text-xs text-text-secondary">Tempo</div>
            <div className="text-sm font-bold text-text-primary">{recipe.prepTimeMinutes} min</div>
          </div>

          <div className="p-3 bg-surface-muted/70 rounded-xl sm:rounded-2xl border border-border text-center shadow-subtle">
            <ChefHat className="w-4 h-4 text-primary mx-auto mb-1" />
            <div className="text-xs text-text-secondary">Dificuldade</div>
            <div className="text-sm font-bold text-text-primary">{recipe.difficulty}</div>
          </div>

          <div className="p-3 bg-surface-muted/70 rounded-xl sm:rounded-2xl border border-border text-center shadow-subtle">
            <Users className="w-4 h-4 text-primary mx-auto mb-1" />
            <div className="text-xs text-text-secondary">Rendimento</div>
            <div className="text-sm font-bold text-text-primary">{recipe.servings} porções</div>
          </div>

          <div className="p-3 bg-surface-muted/70 rounded-xl sm:rounded-2xl border border-border text-center shadow-subtle">
            <Flame className="w-4 h-4 text-primary mx-auto mb-1" />
            <div className="text-xs text-text-secondary">Calorias</div>
            <div className="text-sm font-bold text-text-primary">{recipe.caloriesPerServing || 250} kcal</div>
          </div>
        </div>

        {/* Ingredients Checklist */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <span>Ingredientes Necessários</span>
            <span className="text-xs font-normal text-text-secondary">
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
                  className={`p-3 rounded-xl sm:rounded-2xl border flex items-center justify-between text-xs transition-all shadow-subtle ${
                    hasIngredient
                      ? 'bg-emerald-50/90 border-emerald-200/90 text-emerald-950'
                      : 'bg-surface-muted/60 border-border text-text-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {hasIngredient ? (
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-text-secondary/50 shrink-0" />
                    )}
                    <span className={`font-semibold ${hasIngredient ? 'text-emerald-950' : 'text-text-primary'}`}>{ing.name}</span>
                  </div>
                  <span className="text-text-secondary font-medium">
                    {ing.quantity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-text-primary">Modo de Preparo</h4>
          <ol className="space-y-2.5">
            {instructions.map((step: string, idx: number) => (
              <li
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl sm:rounded-2xl bg-surface-muted/60 border border-border text-xs sm:text-sm text-text-primary leading-relaxed shadow-subtle"
              >
                <span className="w-6 h-6 rounded-full bg-primary/15 text-primary font-extrabold flex items-center justify-center shrink-0 text-xs">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Source and License Attribution */}
        {recipe.sources && recipe.sources.length > 0 && (
          <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-secondary">
            {recipe.sources.map((src, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="font-semibold text-text-primary">Fonte:</span>
                {src.url ? (
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-primary transition-colors"
                  >
                    {src.attribution || src.sourceId}
                  </a>
                ) : (
                  <span>{src.attribution || src.sourceId}</span>
                )}
                {src.license && (
                  <span className="bg-surface-muted px-1.5 py-0.5 rounded border border-border text-text-secondary text-[10px]">
                    {src.license}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
