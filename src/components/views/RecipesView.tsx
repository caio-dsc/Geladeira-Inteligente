import React, { useState } from 'react';
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
}

export const RecipesView: React.FC<RecipesViewProps> = ({
  recipes,
  inventory,
  onSelectRecipe,
  onNavigateToInventory,
  onRefreshRecipes,
  isRefreshingRecipes,
  recipesUpdatedAt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMatch, setFilterMatch] = useState<'all' | 'ready' | 'high'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDiet, setSelectedDiet] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Todas as Categorias' },
    { id: 'Café & Lanches', label: 'Café & Lanches' },
    { id: 'Almoço & Jantar', label: 'Almoço & Jantar' },
    { id: 'Acompanhamentos', label: 'Acompanhamentos' },
    { id: 'Saladas', label: 'Saladas' },
    { id: 'Massas', label: 'Massas' },
    { id: 'Sobremesas', label: 'Sobremesas' },
  ];

  const dietFilters = [
    { id: 'all', label: 'Todas Dietas' },
    { id: 'sem_gluten', label: 'Sem Glúten' },
    { id: 'vegano', label: 'Vegano' },
    { id: 'vegetariano', label: 'Vegetariano' },
    { id: 'sem_lactose', label: 'Sem Lactose' },
    { id: 'sem_frituras', label: 'Sem Frituras' },
    { id: 'low_carb', label: 'Low Carb' },
    { id: 'rico_em_proteina', label: 'Proteico' },
  ];

  const filteredRecipes = recipes
    .filter((recipe) => {
      const matchesSearch = 
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;

      let matchesDiet = true;
      if (selectedDiet !== 'all' && recipe.diet) {
        const d = recipe.diet;
        if (selectedDiet === 'sem_gluten') matchesDiet = d.hasGluten === false;
        else if (selectedDiet === 'vegano') matchesDiet = d.vegan === true;
        else if (selectedDiet === 'vegetariano') matchesDiet = d.vegetarian === true || d.vegan === true || d.hasMeat === false;
        else if (selectedDiet === 'sem_lactose') matchesDiet = d.hasLactose === false;
        else if (selectedDiet === 'sem_frituras') matchesDiet = d.usesFrying !== true;
        else if (selectedDiet === 'low_carb') matchesDiet = d.lowCarb === true;
        else if (selectedDiet === 'rico_em_proteina') matchesDiet = d.highProtein === true;
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

        {/* Diet Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none pt-1 border-t border-emerald-500/10">
          <span className="text-[11px] font-bold text-emerald-400/80 uppercase tracking-wider whitespace-nowrap mr-1">Dieta:</span>
          {dietFilters.map((diet) => (
            <button
              key={diet.id}
              onClick={() => setSelectedDiet(diet.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedDiet === diet.id
                  ? 'bg-emerald-400 text-stone-950 font-bold shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                  : 'bg-emerald-950/40 text-emerald-300/70 hover:text-emerald-100 hover:bg-emerald-900/40 border border-emerald-500/10'
              }`}
            >
              {diet.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Recipes */}
      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onClick={onSelectRecipe} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Utensils className="w-8 h-8 text-emerald-400" />}
          title="Nenhuma receita compatível com esses filtros"
          description="Tente relaxar os filtros de busca ou adicione novos ingredientes à sua geladeira para desbloquear mais sugestões."
          actionLabel="Ver Minha Geladeira"
          onAction={onNavigateToInventory}
        />
      )}
    </div>
  );
};
