import React from 'react';
import { RecipeMatch } from '../../types';
import { Clock, ChefHat, Users, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card } from '../common/Card';
import { getRecipeDietBadges } from '../../services/recipeService';

export interface RecipeCardProps {
  recipe: RecipeMatch;
  onClick: (recipe: RecipeMatch) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  const isFullMatch = recipe.matchPercentage === 100;
  const isHighMatch = recipe.matchPercentage >= 70;
  const dietBadges = getRecipeDietBadges(recipe.diet);

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
    <Card
      variant="interactive"
      padding="none"
      onClick={() => onClick(recipe)}
      className="overflow-hidden flex flex-col justify-between group text-left"
    >
      <div>
        {/* Thumbnail with overlay badges */}
        <div className="relative aspect-16/10 w-full overflow-hidden bg-surface-muted">
          <img
            src={imgSrc}
            alt={recipe.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = placeholder;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-90" />

          {/* Match percentage badge */}
          <div className="absolute top-3 right-3">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shadow-subtle backdrop-blur-md ${
                isFullMatch
                  ? 'bg-primary text-white'
                  : isHighMatch
                  ? 'bg-primary-dark text-white border border-white/20'
                  : 'bg-amber-600 text-white border border-amber-400/40'
              }`}
            >
              {isFullMatch ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
              <span>{recipe.matchPercentage}% disponível</span>
            </div>
          </div>

          {/* Category Tag */}
          <div className="absolute bottom-2.5 left-3">
            <span className="text-[11px] font-semibold text-white bg-black/55 backdrop-blur-md border border-white/20 px-2.5 py-0.5 rounded-lg">
              {recipe.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <h4 className="text-base font-bold text-text-primary line-clamp-1 group-hover:text-primary transition-colors">
            {recipe.title}
          </h4>
          <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
            {recipe.description}
          </p>

          {/* Compact Diet Badges */}
          {dietBadges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {dietBadges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-surface-muted border border-border text-text-secondary"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}

          {/* Quick info row */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border text-xs text-text-secondary">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-primary" />
              {recipe.prepTimeMinutes} min
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <ChefHat className="w-3.5 h-3.5 text-primary" />
              {recipe.difficulty}
            </span>
            {recipe.servings && (
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-primary" />
                {recipe.servings} {recipe.servings === 1 ? 'porção' : 'porções'}
              </span>
            )}
          </div>

          {/* Ingredients availability status */}
          <div className="mt-2.5 flex items-center justify-between text-xs">
            {recipe.isReadyToCook ? (
              <span className="text-primary font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Pronta para cozinhar!</span>
              </span>
            ) : (
              <span className="text-amber-800 font-medium flex items-center gap-1.5 min-w-0" title={`Faltam: ${recipe.missingIngredients.join(', ')}`}>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">
                  Falta: <strong className="text-amber-900 font-bold">{recipe.missingIngredients.slice(0, 2).join(', ')}{recipe.missingIngredients.length > 2 ? ` (+${recipe.missingIngredients.length - 2})` : ''}</strong>
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer link */}
      <div className="px-4 sm:px-5 py-3 border-t border-border bg-surface-muted/50 flex items-center justify-between text-xs font-semibold text-primary group-hover:text-primary-dark transition-colors">
        <span>Ver receita e preparo</span>
        <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </Card>
  );
};
