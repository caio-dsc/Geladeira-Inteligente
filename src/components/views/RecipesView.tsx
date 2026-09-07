import React, { useMemo, useState, useEffect } from 'react';
import { RecipeMatch, FoodItem } from '../../types';
import { RecipeCard } from '../recipe/RecipeCard';
import { Input } from '../common/Input';
import { EmptyState } from '../common/EmptyState';
import { 
  matchesDietFilters, 
  matchesDifficultyFilter, 
  matchesServingsFilter 
} from '../../services/recipeService';
import { DifficultyFilterValue, ServingsFilterValue } from '../../utils/dietFilters';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  Utensils,
  RefreshCcw,
  Loader2,
  ChefHat,
  Users
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
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilterValue>('all');
  const [servingsFilter, setServingsFilter] = useState<ServingsFilterValue>('all');

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
        const titleStr = typeof recipe.title === 'string' ? recipe.title : '';
        const descStr = typeof recipe.description === 'string' ? recipe.description : '';
        const matchesSearch = 
          titleStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
          descStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (Array.isArray(recipe.aliases) && recipe.aliases.some((a) => typeof a === 'string' && a.toLowerCase().includes(searchTerm.toLowerCase()))) ||
          (Array.isArray(recipe.ingredients) && recipe.ingredients.some((ing) => typeof ing?.name === 'string' && ing.name.toLowerCase().includes(searchTerm.toLowerCase())));

        const matchesCategory =
          selectedCategory === 'all' || normalizeCategory(recipe.category) === selectedCategory;

        const matchesDiet = matchesDietFilters(recipe.diet, dietFilters);
        const matchesDifficulty = matchesDifficultyFilter(recipe.difficulty, difficultyFilter);
        const matchesServings = matchesServingsFilter(recipe, servingsFilter);

        let matchesMatch = true;
        if (filterMatch === 'ready') matchesMatch = recipe.isReadyToCook;
        if (filterMatch === 'high') matchesMatch = recipe.matchPercentage >= 60;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesDiet &&
          matchesDifficulty &&
          matchesServings &&
          matchesMatch
        );
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
        const titleA = typeof a.title === 'string' ? a.title : '';
        const titleB = typeof b.title === 'string' ? b.title : '';
        return titleA.localeCompare(titleB, 'pt-BR');
      });
  }, [recipes, searchTerm, selectedCategory, dietFilters, difficultyFilter, servingsFilter, filterMatch]);

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
        const titleA = typeof a.title === 'string' ? a.title : '';
        const titleB = typeof b.title === 'string' ? b.title : '';
        return titleA.localeCompare(titleB, 'pt-BR');
      });
    }

    return groups;
  }, [filteredRecipes]);

  const readyCount = recipes.filter((r) => r.isReadyToCook).length;
  const almostReadyCount = recipes.filter((r) => !r.isReadyToCook && r.matchPercentage >= 60).length;

  return (
    <div className="space-y-6 pb-24 md:pb-10 text-text-primary text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 mb-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Sugestões Personalizadas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
            Receitas Compatíveis
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary">
            Receitas calculadas dinamicamente com base nos alimentos da sua geladeira.
          </p>
        </div>

        {/* Badges & Actions */}
        <div className="flex flex-col items-start sm:items-end gap-1.5 self-start sm:self-auto">
          <div className="flex items-center gap-2">
            {/* Ready badge */}
            <div className="flex items-center gap-2 bg-emerald-50 p-2.5 px-4 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-bold shadow-subtle">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{readyCount} {readyCount === 1 ? 'receita pronta' : 'receitas prontas'} para cozinhar</span>
            </div>

            {/* Botão atualizar */}
            <button
              onClick={onRefreshRecipes}
              disabled={!!isRefreshingRecipes}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition shadow-subtle cursor-pointer
                ${isRefreshingRecipes
                  ? 'bg-surface-muted border-border text-text-secondary/40 cursor-not-allowed'
                  : 'bg-surface border-border text-text-primary hover:bg-surface-muted hover:border-primary/40'}
              `}
              title="Recalcular receitas com base na geladeira"
            >
              {isRefreshingRecipes ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <RefreshCcw className="w-4 h-4 text-primary" />
              )}
              Atualizar
            </button>
          </div>

          {recipesUpdatedAt && (
            <div className="text-[11px] text-text-secondary font-medium">
              Última atualização: {new Date(recipesUpdatedAt).toLocaleString('pt-BR')}
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-surface p-4 rounded-2xl sm:rounded-3xl border border-border shadow-soft space-y-3">
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
          <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-xl border border-border shrink-0">
            <button
              onClick={() => setFilterMatch('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterMatch === 'all'
                  ? 'bg-primary text-white shadow-subtle'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Todas ({recipes.length})
            </button>
            <button
              onClick={() => setFilterMatch('ready')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterMatch === 'ready'
                  ? 'bg-primary text-white shadow-subtle'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Prontas ({readyCount})
            </button>
            <button
              onClick={() => setFilterMatch('high')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterMatch === 'high'
                  ? 'bg-primary text-white shadow-subtle'
                  : 'text-text-secondary hover:text-text-primary'
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white shadow-subtle'
                  : 'bg-surface-muted text-text-secondary hover:text-text-primary hover:bg-border/40 border border-border'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Dificuldade & Porções */}
        <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            {/* Dificuldade */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                <ChefHat className="w-3.5 h-3.5 text-primary" />
                Dificuldade:
              </span>
              <select
                id="recipe-difficulty-select"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilterValue)}
                className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-subtle"
              >
                <option value="all">Todas</option>
                <option value="Fácil">Fácil</option>
                <option value="Médio">Médio</option>
                <option value="Avançado">Avançado</option>
              </select>
            </div>

            {/* Porções */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-primary" />
                Porções:
              </span>
              <select
                id="recipe-servings-select"
                value={servingsFilter}
                onChange={(e) => setServingsFilter(e.target.value as ServingsFilterValue)}
                className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-subtle"
              >
                <option value="all">Todas</option>
                <option value="1">1 porção</option>
                <option value="2">2 porções</option>
                <option value="3-4">3–4 porções</option>
                <option value="5+">5+ porções</option>
              </select>
            </div>
          </div>

          {/* Limpar dificuldade e porções se algum estiver diferente de 'all' */}
          {(difficultyFilter !== 'all' || servingsFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setDifficultyFilter('all');
                setServingsFilter('all');
              }}
              className="text-[11px] font-semibold text-danger hover:text-danger/80 transition cursor-pointer"
              title="Redefinir dificuldade e porções"
            >
              Limpar dificuldade & porções
            </button>
          )}
        </div>

        {/* Diet Chips */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
              Filtros de Dieta:
            </span>
            {userDietaryRestrictions && userDietaryRestrictions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setDietFilters(userDietaryRestrictions);
                  onDietaryRestrictionsChange?.(userDietaryRestrictions);
                }}
                className="text-[11px] font-bold text-primary hover:text-primary-dark underline underline-offset-2 transition cursor-pointer"
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
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                    active
                      ? 'bg-primary/15 border-primary/40 text-primary font-bold shadow-subtle'
                      : 'bg-surface-muted border-border text-text-secondary hover:border-primary/40 hover:text-primary'
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
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-danger hover:text-danger/80 transition cursor-pointer"
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
                    <h3 className="text-sm sm:text-base font-bold text-text-primary">{cat}</h3>
                    <p className="text-xs text-text-secondary">{items.length} receita(s)</p>
                  </div>

                  <button
                    onClick={() => setSelectedCategory(cat)}
                    className="text-xs font-bold text-primary hover:text-primary-dark transition cursor-pointer"
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
          icon={<Utensils className="w-8 h-8 text-primary" />}
          title="Nenhuma receita encontrada"
          description="Tente ajustar a busca, filtros ou adicione mais itens na geladeira."
          actionLabel="Ver Geladeira"
          onAction={onNavigateToInventory}
        />
      )}
    </div>
  );
};

