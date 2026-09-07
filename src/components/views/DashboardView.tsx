import React from 'react';
import { 
  User, 
  FoodItem, 
  RecipeMatch, 
  NavigationTab, 
  CategoryType 
} from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { CreditBadge } from '../common/CreditBadge';
import { FoodCard, getCategoryIcon, getCategoryLabel } from '../food/FoodCard';
import { RecipeCard } from '../recipe/RecipeCard';
import { 
  Camera, 
  UtensilsCrossed, 
  Sparkles, 
  Snowflake,
  Leaf,
  ArrowRight, 
  Plus, 
  CheckCircle2,
  ChefHat,
  Refrigerator
} from 'lucide-react';

export interface DashboardViewProps {
  user: User;
  inventory: FoodItem[];
  recipes: RecipeMatch[];
  onNavigate: (tab: NavigationTab) => void;
  onOpenFoodModal: () => void;
  onSelectRecipe: (recipe: RecipeMatch) => void;
  onOpenCreditsModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  inventory,
  recipes,
  onNavigate,
  onOpenFoodModal,
  onSelectRecipe,
  onOpenCreditsModal,
}) => {
  const freshCount = inventory.filter((i) => i.state === 'fresh').length;
  const frozenCount = inventory.filter((i) => i.state === 'frozen').length;
  const readyRecipes = recipes.filter((r) => r.isReadyToCook);

  const categories: Array<{ id: CategoryType; label: string }> = [
    { id: 'vegetables', label: 'Legumes' },
    { id: 'dairy', label: 'Laticínios' },
    { id: 'proteins', label: 'Proteínas' },
    { id: 'fruits', label: 'Frutas' },
    { id: 'drinks', label: 'Bebidas' },
    { id: 'pantry', label: 'Despensa' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 pb-24 md:pb-12 text-text-primary">
      {/* Top Greeting & Balance Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Painel Principal
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight mt-0.5">
            Olá, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Você tem <strong className="text-text-primary font-bold">{inventory.length} itens</strong> catalogados na sua geladeira.
          </p>
        </div>

        {/* Action badge & credits */}
        <div className="flex items-center gap-3">
          <CreditBadge credits={user.credits} onClick={onOpenCreditsModal} />
        </div>
      </div>

      {/* Hero Scanner Card (Action Principal - Visual hierarchy with glow & camera icon) */}
      <div
        id="hero-scanner-section"
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary-dark via-[#0B3D35] to-[#06241F] text-white p-6 sm:p-8 shadow-floating border border-primary/30 text-left"
      >
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold mb-3.5 border border-white/20 backdrop-blur-md">
            <Camera className="w-3.5 h-3.5 text-white" />
            <span>Reconhecimento Visual Instantâneo</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Pronto para atualizar seu estoque?
          </h2>

          <p className="mt-2 text-sm sm:text-base text-white/80 leading-relaxed font-normal">
            Fotografe as prateleiras para identificar alimentos automaticamente, acompanhar prazos de validade e desbloquear receitas.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3.5">
            {/* Primary Hero Button: Escanear minha geladeira */}
            <Button
              id="hero-scan-fridge-btn"
              variant="primary"
              size="lg"
              onClick={() => onNavigate('scanner')}
              className="font-bold text-sm sm:text-base px-6 sm:px-8 py-3.5 shadow-soft cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              leftIcon={<Camera className="w-5 h-5 text-white shrink-0" />}
            >
              Escanear minha geladeira
            </Button>

            <Button
              id="hero-manual-add-btn"
              variant="secondary"
              size="md"
              onClick={onOpenFoodModal}
              className="text-xs sm:text-sm font-semibold py-3 px-4.5 bg-white/15 hover:bg-white/25 text-white border-white/20"
              leftIcon={<Plus className="w-4 h-4 text-white" />}
            >
              Adicionar Manualmente
            </Button>
          </div>
        </div>

        {/* Decorative background visual elements */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 opacity-15 pointer-events-none">
          <Refrigerator className="w-52 h-52 text-white" />
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total in Fridge */}
        <Card variant="interactive" padding="sm" onClick={() => onNavigate('inventory')} className="text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-subtle">
              <UtensilsCrossed className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-semibold text-text-secondary">Estoque</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-text-primary">{inventory.length}</div>
          <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5">Alimentos no total</p>
        </Card>

        {/* Fresh Items */}
        <Card variant="interactive" padding="sm" onClick={() => onNavigate('inventory')} className="text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-subtle">
              <Leaf className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-700">Frescos</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-text-primary">{freshCount}</div>
          <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5">Alimentos frescos</p>
        </Card>

        {/* Frozen Items */}
        <Card variant="interactive" padding="sm" onClick={() => onNavigate('inventory')} className="text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shadow-subtle">
              <Snowflake className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-semibold text-sky-700">Congelados</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-text-primary">{frozenCount}</div>
          <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5">No freezer / congelador</p>
        </Card>

        {/* Ready Recipes */}
        <Card variant="interactive" padding="sm" onClick={() => onNavigate('recipes')} className="text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-subtle">
              <ChefHat className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-semibold text-primary">Receitas</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-text-primary">{readyRecipes.length}</div>
          <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5">Prontas para cozinhar</p>
        </Card>
      </div>

      {/* Category Quick Grid */}
      <div className="space-y-3 text-left">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
            Categorias de Alimentos
          </h3>
          <button
            onClick={() => onNavigate('inventory')}
            className="text-xs font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Ver todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {categories.map((cat) => {
            const count = inventory.filter((i) => i.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => onNavigate('inventory')}
                className="p-3.5 rounded-xl sm:rounded-2xl bg-surface hover:bg-surface-muted border border-border hover:border-primary/40 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-subtle hover:shadow-soft"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-muted border border-border group-hover:border-primary/30 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  {getCategoryIcon(cat.id)}
                </div>
                <span className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">
                  {cat.label}
                </span>
                <span className="text-[10px] text-text-secondary font-medium mt-0.5">
                  {count} {count === 1 ? 'item' : 'itens'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section: Top Recipe Recommendations */}
      <div className="space-y-4 text-left">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight">
              Sugestões de Receitas Compatíveis
            </h3>
            <p className="text-xs text-text-secondary">
              Ideais para preparar com os ingredientes disponíveis no momento.
            </p>
          </div>

          <button
            onClick={() => onNavigate('recipes')}
            className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1 cursor-pointer"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.slice(0, 3).map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onClick={onSelectRecipe} />
          ))}
        </div>
      </div>
    </div>
  );
};
