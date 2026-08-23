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
  Utensils 
} from 'lucide-react';

export interface RecipesViewProps {
  recipes: RecipeMatch[];
  inventory: FoodItem[];
  onSelectRecipe: (recipe: RecipeMatch) => void;
  onNavigateToInventory: () => void;
}

export const RecipesView: React.FC<RecipesViewProps> = ({
  recipes,
  inventory,
  onSelectRecipe,
  onNavigateToInventory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMatch, setFilterMatch] = useState<'all' | 'ready' | 'high'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Todas as Categorias' },
    { id: 'Café & Lanches', label: 'Café & Lanches' },
    { id: 'Almoço & Jantar', label: 'Almoço & Jantar' },
    { id: 'Saladas', label: 'Saladas' },
    { id: 'Sopas & Cremes', label: 'Sopas & Cremes' },
  ];

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = 
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;

    let matchesMatch = true;
    if (filterMatch === 'ready') matchesMatch = recipe.isReadyToCook;
    if (filterMatch === 'high') matchesMatch = recipe.matchPercentage >= 60;

    return matchesSearch && matchesCategory && matchesMatch;
  });

  const readyCount = recipes.filter((r) => r.isReadyToCook).length;

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

        {/* Ready badge */}
        <div className="flex items-center gap-2 bg-[#092617] p-2.5 px-4 rounded-2xl border border-emerald-500/30 text-xs text-emerald-200 font-bold self-start sm:self-auto shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{readyCount} {readyCount === 1 ? 'receita pronta' : 'receitas prontas'} para cozinhar</span>
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
              Prontas (100%)
            </button>
            <button
              onClick={() => setFilterMatch('high')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMatch === 'high'
                  ? 'bg-emerald-500 text-stone-950 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                  : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              Quase Prontas (≥60%)
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
