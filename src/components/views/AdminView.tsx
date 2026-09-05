import React, { useEffect, useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Image as ImageIcon, 
  CheckCircle2, 
  Lock, 
  Search, 
  RefreshCw, 
  Camera, 
  Clock, 
  ChefHat, 
  Filter,
  Sparkles
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { User, Recipe } from '../../types';
import { recipeService } from '../../services/recipeService';
import { RecipePhotoModal } from '../admin/RecipePhotoModal';

export interface AdminViewProps {
  user?: User | null;
  onRecipeUpdated?: () => Promise<void> | void;
  showToast?: (message: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ 
  user,
  onRecipeUpdated,
  showToast
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [photoFilter, setPhotoFilter] = useState<'all' | 'without_photo' | 'with_photo'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal de edição de foto
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Notificação local caso showToast não seja provido
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);

  const notify = (msg: string) => {
    if (showToast) {
      showToast(msg);
    } else {
      setLocalFeedback(msg);
      setTimeout(() => setLocalFeedback(null), 4000);
    }
  };

  const loadCatalog = async (forceFirestoreRefresh = false) => {
    try {
      if (forceFirestoreRefresh) {
        setIsRefreshing(true);
        await recipeService.refreshRecipesFromFirestore();
      } else {
        setIsLoading(true);
      }

      // Obtém o catálogo bruto sem filtros de porções, geladeira ou restrições dietéticas
      const allRecipes: Recipe[] = await recipeService.getRecipes();
      setRecipes(allRecipes);
    } catch (err) {
      console.warn('Erro ao carregar receitas no painel administrativo:', err);
      notify('Falha ao carregar catálogo de receitas.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCatalog(false);
  }, []);

  // Estatísticas calculadas
  const totalRecipes = recipes.length;
  const recipesWithImage = useMemo(() => {
    return recipes.filter((r) => Boolean(r.imageUrl && r.imageUrl.trim())).length;
  }, [recipes]);
  const recipesWithoutImage = totalRecipes - recipesWithImage;

  // Lista de categorias distintas para filtro
  const categories = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set).sort();
  }, [recipes]);

  // Filtragem de receitas para visualização
  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      // Filtro de status de foto
      const hasPhoto = Boolean(r.imageUrl && r.imageUrl.trim());
      if (photoFilter === 'with_photo' && !hasPhoto) return false;
      if (photoFilter === 'without_photo' && hasPhoto) return false;

      // Filtro de categoria
      if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;

      // Filtro de busca de texto
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchTitle = r.title.toLowerCase().includes(query);
        const matchCategory = (r.category || '').toLowerCase().includes(query);
        const matchTags = r.tags ? r.tags.some((t) => t.toLowerCase().includes(query)) : false;
        if (!matchTitle && !matchCategory && !matchTags) return false;
      }

      return true;
    });
  }, [recipes, photoFilter, selectedCategory, searchTerm]);

  const placeholderSvg =
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="#052014"/>
            <stop offset="1" stop-color="#0b2b1b"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
          fill="#7ef0b5" font-family="Arial" font-size="28" font-weight="700">
          Sem foto
        </text>
      </svg>
    `);

  const handleOpenPhotoModal = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsModalOpen(true);
  };

  const handlePhotoUpdateSuccess = async (recipeId: string, newImageUrl: string) => {
    // 1. Atualização imediata no estado local do catálogo
    setRecipes((prev) =>
      prev.map((r) => (r.id === recipeId ? { ...r, imageUrl: newImageUrl } : r))
    );

    // 2. Dispara sincronização global no app se fornecido
    if (onRecipeUpdated) {
      try {
        await onRecipeUpdated();
      } catch (err) {
        console.warn('Aviso ao sincronizar receitas no app:', err);
      }
    }

    const updatedTitle = recipes.find((r) => r.id === recipeId)?.title || 'Receita';
    notify(
      newImageUrl
        ? `Foto de "${updatedTitle}" atualizada com sucesso!`
        : `Foto personalizada de "${updatedTitle}" removida.`
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-left pb-16">
      {/* Toast interno de feedback */}
      {localFeedback && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-emerald-950 border border-emerald-400 text-white shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{localFeedback}</span>
        </div>
      )}

      {/* Cabeçalho do Painel Administrativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Painel Administrativo</h1>
            <p className="text-xs text-emerald-300/70">Gestão e atualização das fotos oficiais das receitas</p>
          </div>
        </div>

        {/* Confirmação visual de Administrador & Botão de Sincronização */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Sessão Admin Autorizada</span>
            {user?.email && <span className="text-emerald-400/60 font-mono text-[11px]">({user.email})</span>}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadCatalog(true)}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            title="Recarregar dados do Firestore"
          >
            Sincronizar
          </Button>
        </div>
      </div>

      {/* Cards de Métricas do Catálogo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#05130b] border border-emerald-500/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-xs text-emerald-300/60 font-medium">Total de Pratos</p>
              <p className="text-xl font-extrabold text-white">
                {isLoading ? '—' : totalRecipes}
              </p>
            </div>
          </div>
          <span className="text-xs text-emerald-400/80 font-medium bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
            Catálogo completo
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#05130b] border border-emerald-500/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-xs text-emerald-300/60 font-medium">Com Foto Definida</p>
              <p className="text-xl font-extrabold text-white">
                {isLoading ? '—' : recipesWithImage}
              </p>
            </div>
          </div>
          <span className="text-xs text-emerald-300 font-bold bg-emerald-500/20 px-2 py-1 rounded-md border border-emerald-500/30">
            {isLoading || !totalRecipes ? '—' : `${Math.round((recipesWithImage / totalRecipes) * 100)}%`}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#05130b] border border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-xs text-amber-300/70 font-medium">Pendentes de Foto</p>
              <p className="text-xl font-extrabold text-amber-300">
                {isLoading ? '—' : recipesWithoutImage}
              </p>
            </div>
          </div>
          <span className="text-xs text-amber-300 font-bold bg-amber-500/15 px-2 py-1 rounded-md border border-amber-500/30">
            {isLoading || !totalRecipes ? '—' : `${Math.round((recipesWithoutImage / totalRecipes) * 100)}%`}
          </span>
        </div>
      </div>

      {/* Barra de Filtros e Busca do Admin */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/60" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar receita por título, categoria ou ingrediente..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#05130b] border border-emerald-500/30 text-white placeholder-emerald-400/40 text-sm focus:outline-hidden focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400/60 hover:text-emerald-300 text-xs px-1.5 py-0.5 rounded bg-emerald-950"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Filtro por Status da Foto */}
          <div className="flex items-center gap-1.5 bg-[#05130b] p-1 rounded-xl border border-emerald-500/20">
            <button
              onClick={() => setPhotoFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                photoFilter === 'all'
                  ? 'bg-emerald-500 text-stone-950 font-bold shadow-xs'
                  : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              Todas ({totalRecipes})
            </button>
            <button
              onClick={() => setPhotoFilter('without_photo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                photoFilter === 'without_photo'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                  : 'text-amber-300/70 hover:text-amber-200'
              }`}
            >
              Sem Foto ({recipesWithoutImage})
            </button>
            <button
              onClick={() => setPhotoFilter('with_photo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                photoFilter === 'with_photo'
                  ? 'bg-emerald-500 text-stone-950 font-bold shadow-xs'
                  : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              Com Foto ({recipesWithImage})
            </button>
          </div>
        </div>

        {/* Filtro por Categoria */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-emerald-400/60 font-semibold flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              Categoria:
            </span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-emerald-950/40 text-emerald-300/60 hover:text-white border border-transparent'
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-emerald-950/40 text-emerald-300/60 hover:text-white border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Lista / Grid de Receitas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-emerald-300/70 px-1">
          <span>
            Exibindo <strong className="text-white">{filteredRecipes.length}</strong> de {totalRecipes} receitas
          </span>
          <span className="text-[11px] text-emerald-400/60 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Upload exclusivo via Firebase Cloud Storage com regras de segurança ativas
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-emerald-300/60 bg-[#05130b] rounded-2xl border border-emerald-500/20">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-400" />
            <p className="text-sm font-semibold text-white">Carregando catálogo completo...</p>
            <p className="text-xs text-emerald-400/60 mt-1">Carregamento direto sem filtros restritivos</p>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="p-12 text-center text-emerald-300/60 bg-[#05130b] rounded-2xl border border-emerald-500/20">
            <ImageIcon className="w-10 h-10 mx-auto mb-3 text-emerald-400/40" />
            <p className="text-base font-bold text-white">Nenhuma receita encontrada</p>
            <p className="text-xs text-emerald-400/60 mt-1">
              Tente alterar os termos de busca ou filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe) => {
              const hasPhoto = Boolean(recipe.imageUrl && recipe.imageUrl.trim());
              const imgSrc = hasPhoto ? recipe.imageUrl : placeholderSvg;

              return (
                <div
                  key={recipe.id}
                  className="rounded-2xl bg-[#081e13]/80 border border-emerald-500/20 hover:border-emerald-500/40 transition-all flex flex-col overflow-hidden group shadow-sm hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                >
                  {/* Thumbnail com Badge de Foto */}
                  <div className="relative aspect-16/10 bg-[#05130b] overflow-hidden border-b border-emerald-500/15">
                    <img
                      src={imgSrc}
                      alt={recipe.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = placeholderSvg;
                      }}
                    />

                    {/* Badge Indicador de Status */}
                    <div className="absolute top-2.5 right-2.5">
                      {hasPhoto ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold backdrop-blur-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Com Foto
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/90 text-amber-300 border border-amber-500/40 text-[10px] font-bold backdrop-blur-xs">
                          <Camera className="w-3 h-3 text-amber-400" />
                          Sem Foto
                        </span>
                      )}
                    </div>

                    {/* Categoria */}
                    {recipe.category && (
                      <div className="absolute bottom-2.5 left-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-black/75 text-emerald-200 text-[10px] font-medium backdrop-blur-xs border border-white/10">
                          {recipe.category}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Conteúdo do Card */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-emerald-300 transition-colors">
                        {recipe.title}
                      </h3>

                      <div className="flex items-center gap-3 mt-1.5 text-xs text-emerald-300/70">
                        {recipe.prepTimeMinutes ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            {recipe.prepTimeMinutes} min
                          </span>
                        ) : null}

                        {recipe.difficulty && (
                          <span className="flex items-center gap-1">
                            <ChefHat className="w-3.5 h-3.5 text-emerald-400" />
                            {recipe.difficulty}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botão de Ação para Foto */}
                    <div className="pt-2 border-t border-emerald-500/10 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-emerald-400/60 font-mono truncate">
                        ID: {recipe.id}
                      </span>

                      <Button
                        variant={hasPhoto ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleOpenPhotoModal(recipe)}
                        leftIcon={<Camera className="w-3.5 h-3.5" />}
                        className="text-xs py-1.5 px-3 font-semibold"
                      >
                        {hasPhoto ? 'Trocar Foto' : 'Adicionar Foto'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Upload/Troca de Foto */}
      <RecipePhotoModal
        recipe={editingRecipe}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecipe(null);
        }}
        onSuccess={handlePhotoUpdateSuccess}
      />
    </div>
  );
};

