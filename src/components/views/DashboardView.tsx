import React, { useMemo } from 'react';
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
import { getCategoryIcon } from '../food/FoodCard';
import { RecipeCard } from '../recipe/RecipeCard';
import { HowItWorksGuide } from '../common/HowItWorksGuide';
import { EmptyState } from '../common/EmptyState';
import { 
  Camera, 
  UtensilsCrossed, 
  Snowflake,
  Leaf,
  ArrowRight, 
  Plus, 
  ChefHat, 
  SlidersHorizontal,
  User as UserIcon,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export interface DashboardViewProps {
  user: User;
  inventory: FoodItem[];
  recipes: RecipeMatch[];
  onNavigate: (tab: NavigationTab) => void;
  onOpenFoodModal: () => void;
  onSelectRecipe: (recipe: RecipeMatch) => void;
  onOpenCreditsModal: () => void;
  onOpenQuickGuide?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  inventory,
  recipes,
  onNavigate,
  onOpenFoodModal,
  onSelectRecipe,
  onOpenCreditsModal,
  onOpenQuickGuide,
}) => {
  // Real inventory metrics
  const freshCount = useMemo(() => inventory.filter((i) => i.state === 'fresh').length, [inventory]);
  const frozenCount = useMemo(() => inventory.filter((i) => i.state === 'frozen').length, [inventory]);
  
  // Real recipe metrics
  const readyRecipes = useMemo(() => recipes.filter((r) => r.isReadyToCook), [recipes]);
  const highMatchRecipes = useMemo(
    () => recipes.filter((r) => !r.isReadyToCook && r.matchPercentage >= 50),
    [recipes]
  );

  // Time of day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const categories: Array<{ id: CategoryType; label: string }> = [
    { id: 'vegetables', label: 'Legumes' },
    { id: 'dairy', label: 'Laticínios' },
    { id: 'proteins', label: 'Proteínas' },
    { id: 'fruits', label: 'Frutas' },
    { id: 'drinks', label: 'Bebidas' },
    { id: 'pantry', label: 'Despensa' },
  ];

  // Top recipes to display (prioritize ready, then highest match)
  const topRecipes = useMemo(() => {
    const sorted = [...recipes].sort((a, b) => {
      if (a.isReadyToCook && !b.isReadyToCook) return -1;
      if (!a.isReadyToCook && b.isReadyToCook) return 1;
      return b.matchPercentage - a.matchPercentage;
    });
    return sorted.slice(0, 3);
  }, [recipes]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-24 md:pb-12 text-text-primary text-left">
      {/* ========================================================================= */}
      {/* 1. SAUDAÇÃO CONTEXTUAL                                                    */}
      {/* ========================================================================= */}
      <section aria-label="Saudação contextual" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Painel Principal
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs text-text-secondary">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight mt-1">
            {greeting}, {user.name.split(' ')[0]} 👋
          </h1>

          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            Gerencie seu estoque de alimentos e descubra receitas práticas com ingredientes que você já possui.
          </p>
        </div>

        {/* User credits badge */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <CreditBadge credits={user.credits} onClick={onOpenCreditsModal} />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. ESTADO ATUAL DA GELADEIRA                                              */}
      {/* ========================================================================= */}
      <section aria-label="Estado atual da geladeira">
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface border border-border shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-subtle ${
              inventory.length > 0 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'bg-surface-muted text-text-secondary border border-border'
            }`}>
              <UtensilsCrossed className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-text-primary">
                  Estado Atual do Inventário
                </h2>
                {inventory.length > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                    Inventário vazio
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                {inventory.length === 0 ? (
                  <span>Você ainda não cadastrou alimentos. Use o scanner ou adicione manualmente.</span>
                ) : (
                  <span>
                    Você tem <strong className="text-text-primary font-bold">{inventory.length} itens</strong> registrados: {freshCount} frescos e {frozenCount} congelados.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('inventory')}
              leftIcon={<UtensilsCrossed className="w-3.5 h-3.5 text-primary" />}
              className="text-xs"
            >
              Abrir Geladeira ({inventory.length})
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. AÇÃO PRINCIPAL: ESCANEAR ALIMENTOS (Composição Visual Imediata)         */}
      {/* ========================================================================= */}
      <section aria-label="Ação principal: Escanear alimentos">
        <div
          id="hero-scanner-section"
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary-dark via-[#0B3D35] to-[#06241F] text-white p-6 sm:p-8 shadow-floating border border-primary/30"
        >
          {/* Spatial 2D ambient lighting elements */}
          <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-primary/25 blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold mb-3.5 border border-white/20 backdrop-blur-md shadow-subtle">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Visão Computacional & Culinária</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Escanear alimentos da geladeira
            </h2>

            <p className="mt-2 text-sm sm:text-base text-white/90 leading-relaxed font-normal">
              Aponte a câmera para as prateleiras ou gavetas para identificar ingredientes automaticamente, acompanhar prazos de validade e desbloquear receitas.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {/* PRIMARY HERO BUTTON */}
              <Button
                id="hero-scan-fridge-btn"
                variant="primary"
                size="lg"
                onClick={() => onNavigate('scanner')}
                className="font-bold text-sm sm:text-base px-6 sm:px-8 py-3.5 shadow-soft cursor-pointer hover:scale-[1.02] active:scale-[0.98] border border-white/30"
                leftIcon={<Camera className="w-5 h-5 text-white shrink-0" />}
              >
                Escanear alimentos
              </Button>

              {/* SECONDARY MANUAL ADD BUTTON */}
              <Button
                id="hero-manual-add-btn"
                variant="secondary"
                size="md"
                onClick={onOpenFoodModal}
                className="text-xs sm:text-sm font-semibold py-3 px-4.5 bg-white/15 hover:bg-white/25 text-white border-white/25"
                leftIcon={<Plus className="w-4 h-4 text-white" />}
              >
                Adicionar alimento manualmente
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. RESUMOS (Dados Reais Apenas)                                            */}
      {/* ========================================================================= */}
      <section aria-label="Resumos do inventário e categorias" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
            Resumos em Tempo Real
          </h3>
          <span className="text-xs text-text-secondary">Dados sincronizados com o estoque</span>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Total in Fridge */}
          <Card variant="interactive" padding="sm" onClick={() => onNavigate('inventory')}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-subtle">
                <UtensilsCrossed className="w-4.5 h-4.5" />
              </div>
              <span className="text-[11px] font-semibold text-text-secondary">Inventário</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-text-primary">{inventory.length}</div>
            <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5">Alimentos no total</p>
          </Card>

          {/* Fresh Items */}
          <Card variant="interactive" padding="sm" onClick={() => onNavigate('inventory')}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-subtle">
                <Leaf className="w-4.5 h-4.5" />
              </div>
              <span className="text-[11px] font-semibold text-emerald-700">Frescos</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-text-primary">{freshCount}</div>
            <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5">Itens frescos</p>
          </Card>

          {/* Frozen Items */}
          <Card variant="interactive" padding="sm" onClick={() => onNavigate('inventory')}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shadow-subtle">
                <Snowflake className="w-4.5 h-4.5" />
              </div>
              <span className="text-[11px] font-semibold text-sky-700">Freezer</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-text-primary">{frozenCount}</div>
            <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5">Itens congelados</p>
          </Card>

          {/* Ready to Cook Recipes */}
          <Card variant="interactive" padding="sm" onClick={() => onNavigate('recipes')}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-subtle">
                <ChefHat className="w-4.5 h-4.5" />
              </div>
              <span className="text-[11px] font-semibold text-primary">Prontas</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-text-primary">{readyRecipes.length}</div>
            <p className="text-[11px] sm:text-xs text-text-secondary mt-0.5">Receitas 100% disponíveis</p>
          </Card>
        </div>

        {/* Category breakdown */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-subtle space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Distribuição por Categoria
            </h4>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Ver no inventário</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {categories.map((cat) => {
              const count = inventory.filter((i) => i.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => onNavigate('inventory')}
                  className="p-3 rounded-xl bg-surface-muted/60 hover:bg-surface-muted border border-border hover:border-primary/30 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-surface border border-border group-hover:border-primary/30 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                    {getCategoryIcon(cat.id)}
                  </div>
                  <span className="text-[11px] font-bold text-text-primary group-hover:text-primary transition-colors">
                    {cat.label}
                  </span>
                  <span className="text-[10px] text-text-secondary font-medium">
                    {count} {count === 1 ? 'item' : 'itens'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. RECEITAS / POSSIBILIDADES (Ready recipes, matching real)               */}
      {/* ========================================================================= */}
      <section aria-label="Receitas e possibilidades culinárias" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
              <span>Receitas & Possibilidades</span>
              {readyRecipes.length > 0 && (
                <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full">
                  {readyRecipes.length} prontas
                </span>
              )}
            </h3>
            <p className="text-xs text-text-secondary">
              {readyRecipes.length > 0
                ? 'Pratos que você pode preparar agora com o que tem na geladeira.'
                : 'Receitas ordenadas pela maior compatibilidade com seus ingredientes.'}
            </p>
          </div>

          <button
            onClick={() => onNavigate('recipes')}
            className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Ver todas ({recipes.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {topRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onClick={onSelectRecipe} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<ChefHat className="w-8 h-8 text-primary" />}
            title="Seu inventário ainda está vazio"
            description="Cadastre seus primeiros alimentos para que nosso algoritmo calcule receitas compatíveis automaticamente."
            actionLabel="Escanear alimentos"
            onAction={() => onNavigate('scanner')}
            actionIcon={<Camera className="w-4 h-4 text-white" />}
          />
        )}
      </section>

      {/* ========================================================================= */}
      {/* 6. ATALHOS SECUNDÁRIOS & TUTORIAL ONBOARDING                               */}
      {/* ========================================================================= */}
      <section aria-label="Atalhos secundários" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
            Atalhos & Guia Rápido
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Shortcut 1: Inventory */}
          <Card 
            variant="interactive" 
            padding="sm" 
            onClick={() => onNavigate('inventory')}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-text-primary">Minha Geladeira</h4>
              <p className="text-[11px] text-text-secondary">Gerenciar itens e validades</p>
            </div>
          </Card>

          {/* Shortcut 2: Recipes with filters */}
          <Card 
            variant="interactive" 
            padding="sm" 
            onClick={() => onNavigate('recipes')}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-text-primary">Filtros & Dietas</h4>
              <p className="text-[11px] text-text-secondary">Vegano, Low Carb, Sem Glúten</p>
            </div>
          </Card>

          {/* Shortcut 3: Preferences & Profile */}
          <Card 
            variant="interactive" 
            padding="sm" 
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-text-primary">Perfil & Porções</h4>
              <p className="text-[11px] text-text-secondary">Ajustar preferências culinárias</p>
            </div>
          </Card>
        </div>

        {/* Guia Rápido / Onboarding */}
        <div className="pt-2">
          <HowItWorksGuide
            onOpenQuickGuide={onOpenQuickGuide}
            onNavigateToScanner={() => onNavigate('scanner')}
            onNavigateToInventory={() => onNavigate('inventory')}
            onNavigateToRecipes={() => onNavigate('recipes')}
            onOpenAddModal={onOpenFoodModal}
            initialCollapsed={inventory.length > 0}
          />
        </div>
      </section>
    </div>
  );
};
