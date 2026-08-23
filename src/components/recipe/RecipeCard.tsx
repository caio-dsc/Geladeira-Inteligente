import React from 'react';
import { RecipeMatch } from '../../types';
import { Clock, ChefHat, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card } from '../common/Card';

export interface RecipeCardProps {
  recipe: RecipeMatch;
  onClick: (recipe: RecipeMatch) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  const isFullMatch = recipe.matchPercentage === 100;
  const isHighMatch = recipe.matchPercentage >= 70;

  return (
    <Card
      variant="interactive"
      padding="none"
      onClick={() => onClick(recipe)}
      className="overflow-hidden flex flex-col justify-between group"
    >
      <div>
        {/* Thumbnail with overlay badges */}
        <div className="relative aspect-16/10 w-full overflow-hidden bg-[#07190f]">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b2116] via-transparent to-transparent opacity-90" />

          {/* Match percentage badge */}
          <div className="absolute top-3 right-3">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-lg backdrop-blur-md ${
                isFullMatch
                  ? 'bg-emerald-500 text-stone-950 shadow-[0_0_15px_rgba(16,185,129,0.6)]'
                  : isHighMatch
                  ? 'bg-emerald-600/90 text-white border border-emerald-400/40'
                  : 'bg-amber-600/90 text-white border border-amber-400/40'
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
            <span className="text-[11px] font-bold text-emerald-200 bg-[#05140c]/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg backdrop-blur-md">
              {recipe.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <h4 className="text-base font-extrabold text-white line-clamp-1 group-hover:text-emerald-300 transition-colors">
            {recipe.title}
          </h4>
          <p className="text-xs text-emerald-300/70 mt-1 line-clamp-2 leading-relaxed">
            {recipe.description}
          </p>

          {/* Quick info row */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-emerald-500/15 text-xs text-emerald-300/70">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              {recipe.prepTimeMinutes} min
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <ChefHat className="w-3.5 h-3.5 text-emerald-400" />
              {recipe.difficulty}
            </span>
          </div>

          {/* Ingredients availability status */}
          <div className="mt-2.5 flex items-center justify-between text-xs">
            {recipe.missingIngredients.length === 0 ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Tudo disponível na geladeira!
              </span>
            ) : (
              <span className="text-amber-300/90 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Falta {recipe.missingIngredients.length} {recipe.missingIngredients.length === 1 ? 'item' : 'itens'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer link */}
      <div className="px-4 sm:px-5 py-3 border-t border-emerald-500/15 bg-emerald-950/40 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
        <span>Ver receita e preparo</span>
        <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </Card>
  );
};
