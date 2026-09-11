import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingList, ShoppingListItem, CategoryType } from '../../types';
import { shoppingListService, formatShoppingListAsText, calculateListTotal } from '../../services/shoppingListService';
import { ShoppingListModal } from '../shopping/ShoppingListModal';
import { ShoppingItemModal } from '../shopping/ShoppingItemModal';
import { FinalizePurchaseModal } from '../shopping/FinalizePurchaseModal';
import { getCategoryLabel } from '../food/FoodCard';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { EmptyState } from '../common/EmptyState';
import {
  ShoppingCart,
  Plus,
  Search,
  Check,
  CheckCheck,
  Share2,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  UtensilsCrossed,
  Sparkles,
  ArrowRight,
  Package,
  Copy,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export interface ShoppingListViewProps {
  userId?: string;
  onNavigateToInventory?: () => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  userId = '',
  onNavigateToInventory,
}) => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros internos da lista selecionada
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Campo de adição rápida
  const [quickItemName, setQuickItemName] = useState('');
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  // Modais
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingListItem | null>(null);

  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Carrega e sincroniza listas em tempo real
  useEffect(() => {
    setIsLoading(true);
    setLists([]);
    setSelectedListId(null);
    const unsubscribe = shoppingListService.subscribeShoppingLists(userId, (loadedLists) => {
      setLists(loadedLists);
      setIsLoading(false);

      // Define a lista ativa caso nenhuma esteja selecionada ou se a atual foi deletada
      setSelectedListId((prev) => {
        if (prev && loadedLists.some((l) => l.id === prev)) {
          return prev;
        }
        return loadedLists.length > 0 ? loadedLists[0].id : null;
      });
    });

    return () => unsubscribe();
  }, [userId]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((cur) => (cur === message ? null : cur));
    }, 3500);
  };

  const selectedList = useMemo(() => {
    return lists.find((l) => l.id === selectedListId) || null;
  }, [lists, selectedListId]);

  // Itens filtrados da lista ativa
  const filteredItems = useMemo(() => {
    if (!selectedList) return [];
    return (selectedList.items || []).filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'completed'
          ? item.completed
          : !item.completed;
      return matchesSearch && matchesStatus;
    });
  }, [selectedList, searchTerm, statusFilter]);

  // Estatísticas da lista ativa com recálculo preciso e sem divergências
  const stats = useMemo(() => {
    if (!selectedList) return { total: 0, completedCount: 0, totalItems: 0, percent: 0 };
    const items = selectedList.items || [];
    const completedCount = items.filter((i) => i.completed).length;
    const totalItems = items.length;
    const percent = totalItems > 0 ? Math.min(100, Math.max(0, Math.round((completedCount / totalItems) * 100))) : 0;
    const total = calculateListTotal(items);
    return {
      total,
      completedCount,
      totalItems,
      percent,
    };
  }, [selectedList]);

  // Handlers de Lista
  const handleSaveList = async (data: { title: string; shoppingDate?: string; shoppingTime?: string }) => {
    if (editingList) {
      await shoppingListService.updateShoppingList(userId, editingList.id, data);
      showToast('Lista atualizada com sucesso!');
    } else {
      const created = await shoppingListService.createShoppingList(userId, data);
      setSelectedListId(created.id);
      showToast('Nova lista de compras criada!');
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (window.confirm('Tem certeza de que deseja excluir esta lista de compras?')) {
      await shoppingListService.deleteShoppingList(userId, listId);
      showToast('Lista removida.');
    }
  };

  // Handlers de Itens
  const handleSaveItem = async (itemData: Omit<ShoppingListItem, 'id'>) => {
    if (!selectedList) return;

    if (editingItem) {
      await shoppingListService.updateItemInList(userId, selectedList, editingItem.id, itemData);
      showToast('Item atualizado.');
    } else {
      await shoppingListService.addItemToList(userId, selectedList, itemData);
      showToast(`"${itemData.name}" adicionado à lista.`);
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedList || !quickItemName.trim()) return;

    try {
      setIsQuickAdding(true);
      await shoppingListService.addItemToList(userId, selectedList, {
        name: quickItemName.trim(),
        category: 'other',
        quantity: 1,
        unit: 'un',
        price: 0,
        completed: false,
      });
      setQuickItemName('');
    } finally {
      setIsQuickAdding(false);
    }
  };

  const handleQuickAddSuggestion = async (name: string, category: CategoryType, unit: ShoppingListItem['unit']) => {
    if (!selectedList) return;
    await shoppingListService.addItemToList(userId, selectedList, {
      name,
      category,
      quantity: 1,
      unit,
      price: 0,
      completed: false,
    });
    showToast(`"${name}" adicionado.`);
  };

  const handleToggleItem = async (itemId: string) => {
    if (!selectedList) return;
    await shoppingListService.toggleItemCompleted(userId, selectedList, itemId);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!selectedList) return;
    await shoppingListService.deleteItemFromList(userId, selectedList, itemId);
  };

  // Compartilhar / Copiar Lista com compatibilidade mobile
  const handleCopyList = async () => {
    if (!selectedList) return;
    const text = formatShoppingListAsText(selectedList);

    const executeFallbackCopy = () => {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          showToast('Lista copiada para a área de transferência! 📋');
        } else {
          showToast('Não foi possível copiar a lista.');
        }
      } catch {
        showToast('Erro ao copiar a lista.');
      }
    };

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        showToast('Lista copiada para a área de transferência! 📋');
      } else {
        executeFallbackCopy();
      }
    } catch {
      executeFallbackCopy();
    }
  };

  // Finalizar Compra
  const handleConfirmFinalize = async (options: { sendOnlyCompleted: boolean }) => {
    if (!selectedList) return;
    const result = await shoppingListService.finalizePurchase(userId, selectedList, options);
    showToast(`🎉 ${result.transferredCount} alimentos transferidos para sua Geladeira!`);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-10 text-text-primary text-left">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-text-primary text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-floating border border-white/10 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 mb-1.5">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Planejamento & Economia</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
            Lista de Mercado
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary">
            Organize suas compras, controle gastos e envie os itens diretamente para a geladeira.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {onNavigateToInventory && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToInventory}
              leftIcon={<UtensilsCrossed className="w-4 h-4 text-primary" />}
              className="text-xs"
            >
              Minha Geladeira
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingList(null);
              setIsListModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4 text-white" />}
            className="font-bold text-xs"
          >
            Nova Lista
          </Button>
        </div>
      </div>

      {/* List Selector Tabs */}
      {lists.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {lists.map((list) => {
            const isSelected = list.id === selectedListId;
            const itemsCount = list.items?.length || 0;
            return (
              <button
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-subtle'
                    : 'bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-muted border-border'
                }`}
              >
                <span>{list.title}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-surface-muted text-text-secondary'
                  }`}
                >
                  {itemsCount}
                </span>
                {list.completed && (
                  <span
                    title="Lista finalizada"
                    className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
      {selectedList ? (
        <div className="space-y-4">
          {/* Spatial UI 2D Summary Cards Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: Informações da Lista */}
            <Card variant="default" padding="sm" className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Lista Selecionada
                </span>
                {selectedList.completed ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Finalizada
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Ativa
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-text-primary truncate">
                {selectedList.title}
              </h3>
              <div className="flex items-center gap-3 text-[11px] text-text-secondary pt-0.5">
                {selectedList.shoppingDate ? (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-primary" />
                    {selectedList.shoppingDate.split('-').reverse().join('/')}
                    {selectedList.shoppingTime && ` às ${selectedList.shoppingTime}`}
                  </span>
                ) : (
                  <span className="text-text-secondary/70">Sem data agendada</span>
                )}
              </div>
            </Card>

            {/* Card 2: Total Estimado */}
            <Card variant="default" padding="sm" className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Total Estimado
              </span>
              <div className="text-lg sm:text-xl font-black text-primary tracking-tight">
                R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-text-secondary">
                Calculado com base nos preços e quantidades
              </p>
            </Card>

            {/* Card 3: Progresso do Carrinho */}
            <Card variant="default" padding="sm" className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Progresso do Carrinho
                </span>
                <span className="text-xs font-extrabold text-primary">
                  {stats.completedCount}/{stats.totalItems} ({stats.percent}%)
                </span>
              </div>
              <div className="w-full bg-surface-muted h-2 rounded-full overflow-hidden border border-border">
                <div
                  className="bg-primary h-full transition-all duration-300 rounded-full"
                  style={{ width: `${stats.percent}%` }}
                />
              </div>
              <p className="text-[11px] text-text-secondary truncate">
                {stats.completedCount === stats.totalItems && stats.totalItems > 0
                  ? 'Todos os itens comprados!'
                  : `${stats.totalItems - stats.completedCount} itens restantes`}
              </p>
            </Card>
          </div>

          {/* List Action Toolbar */}
          <div className="bg-surface p-3 sm:p-4 rounded-2xl border border-border shadow-subtle flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyList}
                leftIcon={<Share2 className="w-3.5 h-3.5 text-primary" />}
                className="text-xs"
                title="Copiar texto formatado para WhatsApp ou Bloco de Notas"
              >
                Copiar Lista
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingList(selectedList);
                  setIsListModalOpen(true);
                }}
                leftIcon={<Edit2 className="w-3.5 h-3.5 text-text-secondary" />}
                className="text-xs"
                title="Editar título e data da lista"
              >
                Editar
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteList(selectedList.id)}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Excluir lista"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsFinalizeModalOpen(true)}
                leftIcon={<CheckCheck className="w-4 h-4" />}
                className="text-xs font-bold shadow-subtle"
                disabled={stats.totalItems === 0}
              >
                Finalizar Compra
              </Button>
            </div>
          </div>

          {/* Quick Add & Filter Card */}
          <div className="bg-surface p-4 rounded-2xl border border-border shadow-soft space-y-3">
            {/* Quick Add Form */}
            <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Adição rápida (ex: Tomate, Feijão, Macarrão)..."
                  value={quickItemName}
                  onChange={(e) => setQuickItemName(e.target.value)}
                  leftIcon={<Package className="w-4 h-4 text-text-secondary" />}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!quickItemName.trim() || isQuickAdding}
                  isLoading={isQuickAdding}
                  className="font-bold text-xs shrink-0"
                >
                  Adicionar
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingItem(null);
                    setIsItemModalOpen(true);
                  }}
                  leftIcon={<Plus className="w-3.5 h-3.5 text-primary" />}
                  className="text-xs shrink-0"
                >
                  Detalhado
                </Button>
              </div>
            </form>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/70">
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Buscar na lista..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="w-3.5 h-3.5 text-text-secondary" />}
                  className="text-xs"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-primary text-white shadow-subtle'
                      : 'bg-surface-muted text-text-secondary hover:text-text-primary border border-border'
                  }`}
                >
                  Todos ({stats.totalItems})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === 'pending'
                      ? 'bg-primary text-white shadow-subtle'
                      : 'bg-surface-muted text-text-secondary hover:text-text-primary border border-border'
                  }`}
                >
                  Pendentes ({stats.totalItems - stats.completedCount})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === 'completed'
                      ? 'bg-primary text-white shadow-subtle'
                      : 'bg-surface-muted text-text-secondary hover:text-text-primary border border-border'
                  }`}
                >
                  No Carrinho ({stats.completedCount})
                </button>
              </div>
            </div>
          </div>

          {/* Items Checklist List */}
          {filteredItems.length > 0 ? (
            <div className="space-y-2">
              {filteredItems.map((item) => {
                const subtotal = (Number(item.quantity) || 1) * (Number(item.price) || 0);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all ${
                      item.completed
                        ? 'bg-surface-muted/40 border-border/60 opacity-80'
                        : 'bg-surface border-border hover:border-primary/40 shadow-subtle'
                    }`}
                  >
                    {/* Left: Checkbox and Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Interactive Custom Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleItem(item.id)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                          item.completed
                            ? 'bg-primary text-white shadow-subtle'
                            : 'border-2 border-border hover:border-primary/60 bg-white'
                        }`}
                        title={item.completed ? 'Marcar como pendente' : 'Marcar como comprado'}
                        aria-label={item.completed ? `Desmarcar ${item.name}` : `Marcar ${item.name} como comprado`}
                      >
                        {item.completed && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-sm font-bold truncate ${
                              item.completed ? 'line-through text-text-secondary' : 'text-text-primary'
                            }`}
                          >
                            {item.name}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface-muted text-text-secondary border border-border/60 shrink-0">
                            {getCategoryLabel(item.category)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-text-secondary mt-0.5 flex-wrap">
                          <span className="font-semibold text-text-primary">
                            {item.quantity} {item.unit}
                          </span>
                          {item.price > 0 && (
                            <span>
                              (R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} cada)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Subtotal & Actions */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2 sm:ml-3">
                      {item.price > 0 && (
                        <div className="text-right">
                          <span className="text-xs font-black text-primary whitespace-nowrap">
                            R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setIsItemModalOpen(true);
                          }}
                          className="p-2 sm:p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-muted cursor-pointer transition-all min-w-[32px] min-h-[32px] flex items-center justify-center"
                          title="Editar item"
                          aria-label={`Editar ${item.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 sm:p-1.5 rounded-lg text-text-secondary hover:text-red-600 hover:bg-red-50 cursor-pointer transition-all min-w-[32px] min-h-[32px] flex items-center justify-center"
                          title="Excluir item"
                          aria-label={`Excluir ${item.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-surface p-8 rounded-3xl border border-border text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-text-primary">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Nenhum item encontrado com esses filtros'
                    : 'Nenhum item nesta lista de compras'}
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Tente limpar a busca ou alternar para a aba "Todos".'
                    : 'Adicione itens pelo campo rápido acima ou escolha entre as sugestões abaixo:'}
                </p>
              </div>

              {/* Suggestions Quick Buttons */}
              {!searchTerm && statusFilter === 'all' && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block mb-2">
                    Sugestões Frequentes:
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-lg mx-auto">
                    {[
                      { name: 'Leite', cat: 'dairy' as CategoryType, unit: 'L' as const },
                      { name: 'Ovos', cat: 'proteins' as CategoryType, unit: 'un' as const },
                      { name: 'Arroz', cat: 'pantry' as CategoryType, unit: 'kg' as const },
                      { name: 'Feijão', cat: 'pantry' as CategoryType, unit: 'kg' as const },
                      { name: 'Tomate', cat: 'vegetables' as CategoryType, unit: 'kg' as const },
                      { name: 'Pão Francês', cat: 'bakery' as CategoryType, unit: 'un' as const },
                      { name: 'Café', cat: 'pantry' as CategoryType, unit: 'pct' as const },
                      { name: 'Banana', cat: 'fruits' as CategoryType, unit: 'kg' as const },
                    ].map((sug) => (
                      <button
                        key={sug.name}
                        type="button"
                        onClick={() => handleQuickAddSuggestion(sug.name, sug.cat, sug.unit)}
                        className="px-2.5 py-1 rounded-xl bg-surface-muted hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-border text-xs font-semibold text-text-secondary transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{sug.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Empty State when user has no lists */
        <EmptyState
          icon={<ShoppingCart className="w-8 h-8 text-primary" />}
          title="Você ainda não tem listas de compras"
          description="Crie listas para a feira, supermercado ou eventos especiais e abasteça sua geladeira de forma prática."
          actionLabel="Criar Primeira Lista"
          onAction={() => {
            setEditingList(null);
            setIsListModalOpen(true);
          }}
          actionIcon={<Plus className="w-4 h-4 text-white" />}
        />
      )}

      {/* Modals */}
      <ShoppingListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        onSave={handleSaveList}
        initialData={editingList}
      />

      <ShoppingItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
        initialData={editingItem}
      />

      {selectedList && (
        <FinalizePurchaseModal
          isOpen={isFinalizeModalOpen}
          onClose={() => setIsFinalizeModalOpen(false)}
          list={selectedList}
          onConfirm={handleConfirmFinalize}
        />
      )}
    </div>
  );
};
