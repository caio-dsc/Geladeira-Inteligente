import React, { useMemo, useState, useEffect } from 'react';
import { RecipeMatch, FoodItem } from '../../types';
import { RecipeCard } from '../recipe/RecipeCard';
import { Input } from '../common/Input';
import { EmptyState } from '../common/EmptyState';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  Utensils,
  RefreshCcw,
  Loader2
} from 'lucide-react';

export interface RecipesViewProps {
  recipes: RecipeMatch[];
  inventory: FoodItem[];
  onSelectRecipe: (recipe: RecipeMatch) => void;
  onNavigateToInventory: () => void;
  onRefreshRecipes: () => void;
  isRefreshingRecipes?: boolean;
  recipesUpdatedAt?: number | null;
  userDietaryRestrictions?: string[];
  onDietaryRestrictionsChange?: (next: string[]) => void;
}

const normalizeCategory = (c?: string) => (c && c.trim() ? c.trim() : 'Outros');

export const DIET_FILTERS = [
  'Sem Frituras',
  'Vegetariano',
  'Vegano',
  'Sem Glúten',
  'Sem Lactose',
  'Low Carb',
  'Rico em Proteína',
] as const;

export const RecipesView: React.FC<RecipesViewProps> = ({
  recipes,
  inventory,
  onSelectRecipe,
  onNavigateToInventory,
  onRefreshRecipes,
  isRefreshingRecipes,
  recipesUpdatedAt,
  userDietaryRestrictions,
  onDietaryRestrictionsChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMatch, setFilterMatch] = useState<'all' | 'ready' | 'high'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dietFilters, setDietFilters] = useState<string[]>(userDietaryRestrictions ?? []);

  // se o perfil mudar (ex.: voltou do Profile), sincroniza
  useEffect(() => {
    setDietFilters(userDietaryRestrictions ?? []);
  }, [userDietaryRestrictions]);

  const toggleDiet = (label: string) => {
    setDietFilters((prev) => {
      const next = prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label];
      onDietaryRestrictionsChange?.(next);
      return next;
    });
  };

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of recipes) {
      const cat = normalizeCategory(r.category);
      map.set(cat, (map.get(cat) || 0) + 1);
    }
    return map;
  }, [recipes]);

  const categories = useMemo(() => {
    const preferredOrder: string[] = [
      'Café & Lanches',
      'Almoço & Jantar',
      'Saladas',
      'Sopas & Cremes',
      'Sobremesas',
      'Bebidas',
      'Outros',
    ];

    const present: string[] = Array.from(categoryCounts.keys());

    // ordena: primeiro as preferidas na ordem acima, depois o resto por A-Z
    const ordered: string[] = [
      ...preferredOrder.filter((c) => categoryCounts.has(c)),
      ...present
        .filter((c) => !preferredOrder.includes(c))
        .sort((a, b) => a.localeCompare(b, 'pt-BR')),
    ];

    return [
      { id: 'all', label: `Todas as Categorias (${recipes.length})` },
      ...ordered.map((c) => ({ id: c, label: `${c} (${categoryCounts.get(c) || 0})` })),
    ];
  }, [categoryCounts, recipes.length]);

  const filteredRecipes = useMemo(() => {
    return recipes
      .filter((recipe) => {
        const matchesSearch = 
          recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (recipe.aliases && recipe.aliases.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase()))) ||
          recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory =
          selectedCategory === 'all' || normalizeCategory(recipe.category) === selectedCategory;

        let matchesDiet = true;
        if (dietFilters.length > 0 && recipe.diet) {
          const d = recipe.diet;
          for (const pref of dietFilters) {
            switch (pref) {
              case 'Vegetariano':
                if (d.hasMeat === true || d.vegetarian === false) matchesDiet = false;
                break;
              case 'Vegano':
                if (d.vegan !== true) matchesDiet = false;
                break;
              case 'Sem Glúten':
                if (d.hasGluten === true) matchesDiet = false;
                break;
              case 'Sem Lactose':
                if (d.hasLactose === true) matchesDiet = false;
                break;
              case 'Sem Frituras':
                if (d.usesFrying === true) matchesDiet = false;
                break;
              case 'Low Carb':
                if (d.lowCarb === false) matchesDiet = false;
                break;
              case 'Rico em Proteína':
                if (d.highProtein !== true) matchesDiet = false;
                break;
              default:
                break;
            }
            if (!matchesDiet) break;
          }
        }

        let matchesMatch = true;
        if (filterMatch === 'ready') matchesMatch = recipe.isReadyToCook;
        if (filterMatch === 'high') matchesMatch = recipe.matchPercentage >= 60;

        return matchesSearch && matchesCategory && matchesDiet && matchesMatch;
      })
      .sort((a, b) => {
        // 1. isReadyToCook desc (Prontas primeiro)
        if (a.isReadyToCook !== b.isReadyToCook) {
          return a.isReadyToCook ? -1 : 1;
        }
        // 2. matchPercentage desc
        if (b.matchPercentage !== a.matchPercentage) {
          return b.matchPercentage - a.matchPercentage;
        }
        // 3. title asc (ordem alfabética)
        return a.title.localeCompare(b.title, 'pt-BR');
      });
  }, [recipes, searchTerm, selectedCategory, dietFilters, filterMatch]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, RecipeMatch[]> = {};
    for (const r of filteredRecipes) {
      const cat = normalizeCategory(r.category);
      (groups[cat] ||= []).push(r);
    }

    // ordena dentro de cada categoria: prontas primeiro, depois match%, depois título
    for (const cat of Object.keys(groups)) {
      groups[cat].sort((a, b) => {
        const readyDiff = Number(b.isReadyToCook) - Number(a.isReadyToCook);
        if (readyDiff !== 0) return readyDiff;
        const matchDiff = (b.matchPercentage || 0) - (a.matchPercentage || 0);
        if (matchDiff !== 0) return matchDiff;
        return a.title.localeCompare(b.title, 'pt-BR');
      });
    }

    return groups;
  }, [filteredRecipes]);

  const readyCount = recipes.filter((r) => r.isReadyToCook).length;
  const almostReadyCount = recipes.filter((r) => !r.isReadyToCook && r.matchPercentage >= 60).length;

  return (
    <div className="space-y-6 pb-24 md:pb-10 text-emerald-100 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30 mb-1.5 backdrop-blur-md">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Sugestões Personalizadas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Receitas Compatíveis
          </h1>
          <p className="text-xs sm:text-sm text-emerald-300/70">
            Receitas calculadas dinamicamente com base nos alimentos da sua geladeira.
          </p>
        </div>

        {/* Badges & Actions */}
        <div className="flex flex-col items-start sm:items-end gap-1.5 self-start sm:self-auto">
          <div className="flex items-center gap-2">
            {/* Ready badge */}
            <div className="flex items-center gap-2 bg-[#092617] p-2.5 px-4 rounded-2xl border border-emerald-500/30 text-xs text-emerald-200 font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{readyCount} {readyCount === 1 ? 'receita pronta' : 'receitas prontas'} para cozinhar</span>
            </div>

            {/* Botão atualizar */}
            <button
              onClick={onRefreshRecipes}
              disabled={!!isRefreshingRecipes}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border text-xs font-black transition
                ${isRefreshingRecipes
                  ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/25'}
              `}
              title="Recalcular receitas com base na geladeira"
            >
              {isRefreshingRecipes ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCcw className="w-4 h-4" />
              )}
              Atualizar
            </button>
          </div>

          {recipesUpdatedAt && (
            <div className="text-[11px] text-emerald-300/60 font-medium">
              Última atualização: {new Date(recipesUpdatedAt).toLocaleString('pt-BR')}
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#081e13]/85 p-4 rounded-3xl border border-emerald-500/20 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar por receita ou ingrediente (ex: Omelete, Frango, Cenoura)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Quick filter tabs */}
          <div className="flex items-center gap-1 bg-[#05140c] p-1.5 rounded-2xl border border-emerald-500/20 shrink-0">
            <button
              onClick={() => setFilterMatch('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMatch === 'all'
                  ? 'bg-emerald-500 text-stone-950 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                  : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              Todas ({recipes.length})
            </button>
            <button
              onClick={() => setFilterMatch('ready')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMatch === 'ready'
                  ? 'bg-emerald-500 text-stone-950 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                  : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              Prontas ({readyCount})
            </button>
            <button
              onClick={() => setFilterMatch('high')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMatch === 'high'
                  ? 'bg-emerald-500 text-stone-950 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                  : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              Quase Prontas ({almostReadyCount})
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-500 text-stone-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'bg-[#092416] text-emerald-300/80 hover:text-white hover:bg-[#0e3320] border border-emerald-500/15'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Diet Chips */}
        <div className="pt-2 border-t border-emerald-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-400/80 uppercase tracking-wider">
              Filtros de Dieta:
            </span>
            {userDietaryRestrictions && userDietaryRestrictions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setDietFilters(userDietaryRestrictions);
                  onDietaryRestrictionsChange?.(userDietaryRestrictions);
                }}
                className="text-[11px] font-bold text-emerald-400/90 hover:text-emerald-200 underline underline-offset-2 transition cursor-pointer"
                title="Restaurar restrições salvas no perfil"
              >
                Usar do perfil
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {DIET_FILTERS.map((label) => {
              const active = dietFilters.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleDiet(label)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                    active
                      ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                      : 'bg-white/5 border-white/10 text-white/60 hover:border-emerald-500/30 hover:text-emerald-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}

            {dietFilters.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setDietFilters([]);
                  onDietaryRestrictionsChange?.([]);
                }}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-rose-300/80 hover:text-rose-200 transition cursor-pointer"
              >
                Limpar dietas
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Recipes */}
      {filteredRecipes.length > 0 ? (
        selectedCategory === 'all' ? (
          <div className="space-y-8">
            {(Object.entries(groupedByCategory) as [string, RecipeMatch[]][]).map(([cat, items]) => (
              <div key={cat} className="space-y-3">
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white">{cat}</h3>
                    <p className="text-xs text-emerald-300/60">{items.length} receita(s)</p>
                  </div>

                  <button
                    onClick={() => setSelectedCategory(cat)}
                    className="text-xs font-black text-emerald-300 hover:text-white transition cursor-pointer"
                  >
                    Ver todas
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {items.slice(0, 6).map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} onClick={onSelectRecipe} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onClick={onSelectRecipe} />
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={<Utensils className="w-8 h-8 text-emerald-400" />}
          title="Nenhuma receita encontrada"
          message="Tente ajustar a busca, filtros ou adicione mais itens na geladeira."
          actionLabel="Ver Geladeira"
          onAction={onNavigateToInventory}
        />
      )}
    </div>
  );
};

