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
  Sparkles,
  Users,
  UserCheck,
  UserX,
  KeyRound,
  UserPlus,
  Check,
  X,
  CreditCard,
  Zap,
  Mail
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { User, Recipe } from '../../types';
import { recipeService } from '../../services/recipeService';
import { firestoreService } from '../../services/firestoreService';
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
  const [adminTab, setAdminTab] = useState<'recipes' | 'users'>('recipes');

  // Estado das receitas
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [photoFilter, setPhotoFilter] = useState<'all' | 'without_photo' | 'with_photo'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Estado dos usuários (Fase 3, 6 e 7 - scanEnabled e clientes pagos)
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  // Cadastro de clientes pagos (Fase 7)
  const [newPaidEmail, setNewPaidEmail] = useState<string>('');
  const [newPaidName, setNewPaidName] = useState<string>('');
  const [isRegisteringPaid, setIsRegisteringPaid] = useState<boolean>(false);

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

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const list = await firestoreService.listUsers();
      setUsersList(list);
    } catch (err) {
      console.warn('Erro ao listar usuários:', err);
      notify('Falha ao carregar lista de usuários.');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadCatalog(false);
  }, []);

  useEffect(() => {
    if (adminTab === 'users' && usersList.length === 0) {
      loadUsers();
    }
  }, [adminTab]);

  const handleToggleScanAccess = async (targetUser: User) => {
    const nextVal = !targetUser.scanEnabled;
    setTogglingUserId(targetUser.id);
    try {
      await firestoreService.updateUserScanAccess(targetUser.id, nextVal);
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, scanEnabled: nextVal } : u))
      );
      notify(`Scan ${nextVal ? 'liberado' : 'bloqueado'} para ${targetUser.name || targetUser.email || 'usuário'}.`);
    } catch (err) {
      console.error('Erro ao atualizar permissão de scan:', err);
      notify('Erro ao atualizar permissão no Firestore.');
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleRegisterPaidCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToRegister = newPaidEmail.trim().toLowerCase();
    if (!emailToRegister || !emailToRegister.includes('@')) {
      notify('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    setIsRegisteringPaid(true);
    try {
      const res = await firestoreService.registerPaidCustomer(emailToRegister, newPaidName, true);
      notify(
        res.updatedExistingUser
          ? `Conta de "${emailToRegister}" atualizada para Scan ILIMITADO!`
          : `Cliente "${emailToRegister}" liberado! Terá Scan ILIMITADO ao fazer login.`
      );
      setNewPaidEmail('');
      setNewPaidName('');
      await loadUsers();
    } catch (err) {
      console.error('Erro ao cadastrar cliente pago:', err);
      notify('Erro ao cadastrar cliente pago no Firestore.');
    } finally {
      setIsRegisteringPaid(false);
    }
  };

  // Estatísticas calculadas
  const totalUsers = usersList.length;
  const enabledScanUsers = useMemo(() => usersList.filter((u) => Boolean(u.scanEnabled)).length, [usersList]);
  const disabledScanUsers = totalUsers - enabledScanUsers;
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
        const titleStr = typeof r.title === 'string' ? r.title : '';
        const catStr = typeof r.category === 'string' ? r.category : '';
        const matchTitle = titleStr.toLowerCase().includes(query);
        const matchCategory = catStr.toLowerCase().includes(query);
        const matchTags = Array.isArray(r.tags) ? r.tags.some((t) => typeof t === 'string' && t.toLowerCase().includes(query)) : false;
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
            <h1 className="text-2xl font-bold text-[#065F46] tracking-tight">Painel Administrativo</h1>
            <p className="text-xs text-[#0F766E] font-medium">Gestão e atualização das fotos oficiais das receitas</p>
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
            variant="primary"
            size="sm"
            onClick={() => loadCatalog(true)}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            title="Recarregar dados do Firestore"
            className="bg-[#0F766E] hover:bg-[#0D655E] active:bg-[#0B534D] text-white border border-[#0D9488] shadow-sm hover:shadow-md transition-all font-bold px-3.5 py-2"
          >
            Sincronizar
          </Button>
        </div>
      </div>

      {/* SELEÇÃO DE ABAS DO ADMIN */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setAdminTab('recipes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            adminTab === 'recipes'
              ? 'bg-primary text-white shadow-subtle'
              : 'bg-surface text-text-secondary hover:text-text-primary border border-border'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span>Catálogo de Receitas ({totalRecipes})</span>
        </button>

        <button
          onClick={() => setAdminTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            adminTab === 'users'
              ? 'bg-primary text-white shadow-subtle'
              : 'bg-surface text-text-secondary hover:text-text-primary border border-border'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Controle de Acesso ao Scan (scanEnabled)</span>
        </button>
      </div>

      {/* ABA DE USUÁRIOS (FASE 6 E FASE 7) */}
      {adminTab === 'users' ? (
        <div className="space-y-6">
          {/* CARDS DE MÉTRICAS RÁPIDAS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surface border border-border shadow-subtle flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-text-secondary font-medium">Total de Usuários</p>
                  <p className="text-xl font-extrabold text-text-primary">
                    {isLoadingUsers ? '—' : totalUsers}
                  </p>
                </div>
              </div>
              <span className="text-xs text-text-secondary font-medium bg-surface-muted px-2 py-1 rounded-md border border-border">
                Cadastros
              </span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 shadow-subtle flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs text-emerald-700 font-medium">Scan Liberado (Ilimitado)</p>
                  <p className="text-xl font-extrabold text-emerald-800">
                    {isLoadingUsers ? '—' : enabledScanUsers}
                  </p>
                </div>
              </div>
              <span className="text-xs text-emerald-700 font-bold bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                ✅ Liberados
              </span>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 shadow-subtle flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-xs text-amber-700 font-medium">Conta Gratuita (Bloqueado)</p>
                  <p className="text-xl font-extrabold text-amber-800">
                    {isLoadingUsers ? '—' : disabledScanUsers}
                  </p>
                </div>
              </div>
              <span className="text-xs text-amber-700 font-bold bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                ❌ Bloqueados
              </span>
            </div>
          </div>

          {/* FASE 7 — CADASTRO DE CLIENTES PAGOS */}
          <Card className="p-5 border-border shadow-subtle space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-text-primary">
                      Cadastro de Clientes Pagos
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                      SCAN ILIMITADO
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Recebeu o pagamento? Cadastre ou libere o e-mail do cliente aqui para concessão automática de acesso.
                  </p>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-2 text-[11px] text-text-secondary bg-surface-muted px-3 py-1.5 rounded-lg border border-border">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span>Ativação instantânea no Firestore</span>
              </div>
            </div>

            {/* FLUXO EXPLICATIVO */}
            <div className="bg-surface-muted/60 p-3 rounded-xl border border-border text-xs text-text-secondary flex flex-wrap items-center gap-2">
              <span className="font-semibold text-text-primary">Fluxo do Cliente:</span>
              <span className="px-2 py-0.5 rounded bg-surface border border-border">1. Cadastro normal (Gratuito)</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-surface border border-border">2. Cliente compra</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-semibold">3. Você cadastra/libera aqui</span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-bold">4. SCAN ILIMITADO</span>
            </div>

            {/* FORMULÁRIO DE CADASTRO */}
            <form onSubmit={handleRegisterPaidCustomer} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="email"
                  value={newPaidEmail}
                  onChange={(e) => setNewPaidEmail(e.target.value)}
                  placeholder="E-mail do cliente pago (ex: maria@email.com)..."
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-muted border border-border text-text-primary placeholder-text-secondary/60 text-sm focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="relative sm:w-64">
                <input
                  type="text"
                  value={newPaidName}
                  onChange={(e) => setNewPaidName(e.target.value)}
                  placeholder="Nome do cliente (opcional)..."
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-muted border border-border text-text-primary placeholder-text-secondary/60 text-sm focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isRegisteringPaid}
                leftIcon={<UserPlus className="w-4 h-4" />}
                className="font-bold shrink-0"
              >
                Liberar Scan Ilimitado
              </Button>
            </form>
          </Card>

          {/* FASE 6 — TABELA DE USUÁRIOS */}
          <Card className="p-5 border-border shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-text-primary">
                    Usuários
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                    PAINEL ADMINISTRATIVO
                  </span>
                </div>
                <p className="text-xs text-text-secondary">
                  Controle as permissões de Scan diretamente na tabela, sem precisar mexer no console do Firestore.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadUsers}
                  isLoading={isLoadingUsers}
                  leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />}
                >
                  Recarregar
                </Button>
              </div>
            </div>

            {/* FILTRO DE BUSCA */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Buscar usuário por nome ou email..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-muted border border-border text-text-primary placeholder-text-secondary/60 text-sm focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {userSearchTerm && (
                <button
                  onClick={() => setUserSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-xs px-1.5 py-0.5 rounded bg-surface border border-border cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* TABELA DE USUÁRIOS (FASE 6) */}
            {isLoadingUsers ? (
              <div className="text-center py-16">
                <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold text-text-primary">Carregando usuários do Firestore...</p>
              </div>
            ) : usersList.length === 0 ? (
              <div className="p-8 text-center bg-surface-muted/50 rounded-xl border border-border">
                <Users className="w-10 h-10 text-text-secondary/40 mx-auto mb-3" />
                <p className="text-base font-bold text-text-primary">Nenhum usuário cadastrado encontrado no Firestore</p>
                <p className="text-xs text-text-secondary mt-1">
                  Cadastre clientes acima ou aguarde o primeiro login de novos usuários.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-muted border-b border-border text-[12px] font-bold text-text-secondary tracking-wider">
                      <th className="py-3 px-4">Nome</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Scan</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {usersList
                      .filter((u) => {
                        if (!userSearchTerm.trim()) return true;
                        const q = userSearchTerm.toLowerCase();
                        return (
                          (u.name || '').toLowerCase().includes(q) ||
                          (u.email || '').toLowerCase().includes(q)
                        );
                      })
                      .map((u) => {
                        const isEnabled = Boolean(u.scanEnabled);
                        const isToggling = togglingUserId === u.id;

                        return (
                          <tr
                            key={u.id}
                            className="hover:bg-surface-muted/40 transition-colors"
                          >
                            {/* COLUNA: NOME */}
                            <td className="py-3.5 px-4 font-semibold text-text-primary whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                  {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-text-primary">
                                    {u.name || 'Usuário Sem Nome'}
                                  </p>
                                  {u.isAdmin && (
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                      Admin
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* COLUNA: EMAIL */}
                            <td className="py-3.5 px-4 text-text-secondary font-mono text-xs whitespace-nowrap">
                              {u.email || '—'}
                            </td>

                            {/* COLUNA: SCAN */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {isEnabled ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                  <span>✅ Liberado (Ilimitado)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 border border-rose-500/20">
                                  <X className="w-3.5 h-3.5 text-rose-600 stroke-[3]" />
                                  <span>❌ Bloqueado (Gratuito)</span>
                                </span>
                              )}
                            </td>

                            {/* COLUNA: AÇÕES */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <Button
                                variant={isEnabled ? 'outline' : 'primary'}
                                size="sm"
                                onClick={() => handleToggleScanAccess(u)}
                                isLoading={isToggling}
                                className={`font-bold text-xs ${
                                  isEnabled
                                    ? 'hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                                leftIcon={
                                  isEnabled ? (
                                    <UserX className="w-3.5 h-3.5 text-rose-600" />
                                  ) : (
                                    <UserCheck className="w-3.5 h-3.5" />
                                  )
                                }
                              >
                                {isEnabled ? 'Bloquear Scan' : 'Liberar Scan'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <>
      {/* Cards de Métricas do Catálogo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-border shadow-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-text-secondary font-medium">Total de Pratos</p>
              <p className="text-xl font-extrabold text-text-primary">
                {isLoading ? '—' : totalRecipes}
              </p>
            </div>
          </div>
          <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
            Catálogo completo
          </span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-text-secondary font-medium">Com Foto Definida</p>
              <p className="text-xl font-extrabold text-text-primary">
                {isLoading ? '—' : recipesWithImage}
              </p>
            </div>
          </div>
          <span className="text-xs text-primary font-bold bg-primary/15 px-2 py-1 rounded-md border border-primary/25">
            {isLoading || !totalRecipes ? '—' : `${Math.round((recipesWithImage / totalRecipes) * 100)}%`}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-amber-500/20 shadow-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-xs text-amber-700 font-medium">Pendentes de Foto</p>
              <p className="text-xl font-extrabold text-amber-600">
                {isLoading ? '—' : recipesWithoutImage}
              </p>
            </div>
          </div>
          <span className="text-xs text-amber-700 font-bold bg-amber-500/15 px-2 py-1 rounded-md border border-amber-500/30">
            {isLoading || !totalRecipes ? '—' : `${Math.round((recipesWithoutImage / totalRecipes) * 100)}%`}
          </span>
        </div>
      </div>

      {/* Barra de Filtros e Busca do Admin */}
      <Card className="p-4 space-y-4 shadow-subtle">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar receita por título, categoria ou ingrediente..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-muted border border-border text-text-primary placeholder-text-secondary/60 text-sm focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-xs px-1.5 py-0.5 rounded bg-surface border border-border"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Filtro por Status da Foto */}
          <div className="flex items-center gap-1.5 bg-surface-muted p-1 rounded-xl border border-border">
            <button
              onClick={() => setPhotoFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                photoFilter === 'all'
                  ? 'bg-primary text-white font-bold shadow-subtle'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Todas ({totalRecipes})
            </button>
            <button
              onClick={() => setPhotoFilter('without_photo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                photoFilter === 'without_photo'
                  ? 'bg-amber-500 text-white font-bold shadow-subtle'
                  : 'text-amber-700 hover:text-amber-800'
              }`}
            >
              Sem Foto ({recipesWithoutImage})
            </button>
            <button
              onClick={() => setPhotoFilter('with_photo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                photoFilter === 'with_photo'
                  ? 'bg-primary text-white font-bold shadow-subtle'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Com Foto ({recipesWithImage})
            </button>
          </div>
        </div>

        {/* Filtro por Categoria */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-text-secondary font-semibold flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              Categoria:
            </span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-primary/15 text-primary border border-primary/30 font-semibold'
                  : 'bg-surface-muted text-text-secondary hover:text-text-primary border border-border'
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
                    ? 'bg-primary/15 text-primary border border-primary/30 font-semibold'
                    : 'bg-surface-muted text-text-secondary hover:text-text-primary border border-border'
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
                  className="rounded-2xl bg-surface border border-border hover:border-primary/40 transition-all flex flex-col overflow-hidden group shadow-subtle hover:shadow-soft"
                >
                  {/* Thumbnail com Badge de Foto */}
                  <div className="relative aspect-16/10 bg-surface-muted overflow-hidden border-b border-border">
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/90 text-primary border border-border text-[10px] font-bold backdrop-blur-xs shadow-subtle">
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                          Com Foto
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/90 text-amber-600 border border-amber-200 text-[10px] font-bold backdrop-blur-xs shadow-subtle">
                          <Camera className="w-3 h-3 text-amber-600" />
                          Sem Foto
                        </span>
                      )}
                    </div>

                    {/* Categoria */}
                    {recipe.category && (
                      <div className="absolute bottom-2.5 left-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-stone-900/80 text-white text-[10px] font-medium backdrop-blur-xs border border-white/10">
                          {recipe.category}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Conteúdo do Card */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-text-primary line-clamp-1 group-hover:text-primary transition-colors">
                        {recipe.title}
                      </h3>

                      <div className="flex items-center gap-3 mt-1.5 text-xs text-text-secondary">
                        {recipe.prepTimeMinutes ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            {recipe.prepTimeMinutes} min
                          </span>
                        ) : null}

                        {recipe.difficulty && (
                          <span className="flex items-center gap-1">
                            <ChefHat className="w-3.5 h-3.5 text-primary" />
                            {recipe.difficulty}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botão de Ação para Foto */}
                    <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                      <span className="text-[11px] text-text-secondary font-mono truncate">
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
      </>
      )}

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

