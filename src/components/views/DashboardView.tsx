import React from 'react';
import { 
  User, 
  FoodItem, 
  RecipeMatch, 
  NavigationTab, 
  FreshnessState,
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
  BookOpen, 
  Sparkles, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  Plus, 
  Flame, 
  CheckCircle2,
  Layers,
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
  const expiringSoonCount = inventory.filter((i) => i.state === 'expiring_soon').length;
  const attentionCount = inventory.filter((i) => i.state === 'attention').length;
  const freshCount = inventory.filter((i) => i.state === 'fresh').length;
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
    <div className="space-y-6 sm:space-y-8 pb-24 md:pb-12 text-emerald-100">
      {/* Top Greeting & Balance Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Painel Principal
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
            Olá, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-emerald-300/70 mt-1">
            Você tem <strong className="text-white font-bold">{inventory.length} itens</strong> catalogados na sua geladeira.
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
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e3a24] via-[#092316] to-[#05140c] text-white p-6 sm:p-8 shadow-[0_0_40px_rgba(16,185,129,0.25)] border border-emerald-400/40"
      >
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 text-xs font-bold mb-3.5 border border-emerald-400/40 backdrop-blur-md shadow-[0_0_15px_rgba(52,211,153,0.3)]">
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reconhecimento Visual Instantâneo</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Pronto para atualizar seu estoque?
          </h2>

          <p className="mt-2 text-sm sm:text-base text-emerald-100/80 leading-relaxed font-normal">
            Fotografe as prateleiras para identificar alimentos automaticamente, acompanhar prazos de validade e desbloquear receitas.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3.5">
            {/* Primary Hero Button: Escanear minha geladeira with high contrast and camera icon */}
            <Button
              id="hero-scan-fridge-btn"
              variant="primary"
              size="lg"
              onClick={() => onNavigate('scanner')}
              className="font-black text-sm sm:text-base px-6 sm:px-8 py-3.5 shadow-[0_0_30px_rgba(34,197,94,0.6)] cursor-pointer hover:scale-105 active:scale-95"
              leftIcon={<Camera className="w-5 h-5 text-stone-950 shrink-0" />}
            >
              Escanear minha geladeira
            </Button>

            <Button
              id="hero-manual-add-btn"
              variant="secondary"
              size="md"
              onClick={onOpenFoodModal}
              className="text-xs sm:text-sm font-semibold py-3 px-4.5"
              leftIcon={<Plus className="w-4 h-4 text-emerald-400" />}
            >
              Adicionar Manualmente
            </Button>
          </div>
        </div>

        {/* Decorative background visual elements */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
          <Refrigerator className="w-52 h-52 text-emerald-300" />
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total in Fridge */}
        <Card variant="interactive" padding="sm" onClick={() => onNavigate('inventory')} className="text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <UtensilsCrossed className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-400/80">Estoque</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{inventory.length}</div>
          <p className="text-[11px] sm:text-xs text-emerald-300/60 mt-0.5">Alimentos no total</p>
        </Card>

        {/* Expiring Soon Alert */}
        <Card variant="interactive" padding="sm" onClick={() => onNavigate('inventory')} className="text-left">
          <div className="flex items-center justify-between mb-2">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${
              expiringSoonCount > 0 
                ? 'bg-rose-950/80 text-rose-400 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
                : 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
            }`}>
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-bold text-rose-400">Urgente</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{expiringSoonCount}</div>
          <p className="text-[11px] sm:text-xs text-rose-300/70 mt-0.5">Consumir nos próx. 3 dias</p>
        </Card>

        {/* Attention State */}
        <Card variant="interactive" padding="sm" onClick={() => onNavigate('inventory')} className="text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-950/80 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <Clock className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-bold text-amber-400">Atenção</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{attentionCount}</div>
          <p className="text-[11px] sm:text-xs text-amber-300/70 mt-0.5">Consumir nesta semana</p>
        </Card>

        {/* Ready Recipes */}
        <Card variant="interactive" padding="sm" onClick={() => onNavigate('recipes')} className="text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <ChefHat className="w-4.5 h-4.5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-400">Receitas</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{readyRecipes.length}</div>
          <p className="text-[11px] sm:text-xs text-emerald-300/60 mt-0.5">Prontas para cozinhar</p>
        </Card>
      </div>

      {/* Category Quick Grid (Inspired by the category icons in image.png) */}
      <div className="space-y-3 text-left">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-emerald-300/90 uppercase tracking-wider">
            Categorias de Alimentos
          </h3>
          <button
            onClick={() => onNavigate('inventory')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
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
                className="p-3.5 rounded-2xl bg-[#081e13]/90 hover:bg-[#0d2d1d] border border-emerald-500/20 hover:border-emerald-400/50 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-950/90 border border-emerald-500/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                  {getCategoryIcon(cat.id)}
                </div>
                <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {cat.label}
                </span>
                <span className="text-[10px] text-emerald-400/60 font-semibold mt-0.5">
                  {count} {count === 1 ? 'item' : 'itens'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section: Urgent Items to consume (Expiring soon) */}
      {expiringSoonCount > 0 && (
        <div className="space-y-3.5 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <h3 className="text-base font-extrabold text-white">
                Alimentos para Consumir com Urgência
              </h3>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Ver geladeira</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {inventory
              .filter((i) => i.state === 'expiring_soon')
              .slice(0, 3)
              .map((item) => (
                <FoodCard key={item.id} item={item} />
              ))}
          </div>
        </div>
      )}

      {/* Section: Top Recipe Recommendations */}
      <div className="space-y-4 text-left">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              Sugestões de Receitas Compatíveis
            </h3>
            <p className="text-xs text-emerald-300/70">
              Ideais para preparar com os ingredientes disponíveis no momento.
            </p>
          </div>

          <button
            onClick={() => onNavigate('recipes')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
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
