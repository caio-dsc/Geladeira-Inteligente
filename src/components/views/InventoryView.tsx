import React, { useState } from 'react';
import { FoodItem, CategoryType } from '../../types';
import { FoodCard, getCategoryLabel } from '../food/FoodCard';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { EmptyState } from '../common/EmptyState';
import { 
  Plus, 
  Search, 
  Filter, 
  RotateCcw, 
  UtensilsCrossed, 
  Sparkles,
  Camera
} from 'lucide-react';

export interface InventoryViewProps {
  inventory: FoodItem[];
  onOpenAddModal: () => void;
  onEditItem: (item: FoodItem) => void;
  onDeleteItem: (id: string) => void;
  onResetDefault: () => void;
  onNavigateToScanner: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  onOpenAddModal,
  onEditItem,
  onDeleteItem,
  onResetDefault,
  onNavigateToScanner,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'Todos' },
    { id: 'vegetables', label: 'Legumes & Verduras' },
    { id: 'dairy', label: 'Laticínios' },
    { id: 'proteins', label: 'Proteínas' },
    { id: 'fruits', label: 'Frutas' },
    { id: 'drinks', label: 'Bebidas' },
    { id: 'pantry', label: 'Despensa' },
  ];

  const filteredItems = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesState = selectedState === 'all' || item.state === selectedState;

    return matchesSearch && matchesCategory && matchesState;
  });

  return (
    <div className="space-y-6 pb-24 md:pb-10 text-text-primary text-left">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 mb-1.5">
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Estoque em Tempo Real</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
            Minha Geladeira
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary">
            Gerencie os itens disponíveis e controle a validade dos seus alimentos.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToScanner}
            leftIcon={<Camera className="w-4 h-4 text-primary" />}
            className="text-xs"
          >
            Escanear
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onOpenAddModal}
            leftIcon={<Plus className="w-4 h-4 text-white" />}
            className="font-bold text-xs"
          >
            Adicionar Alimento
          </Button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-surface p-4 rounded-2xl sm:rounded-3xl border border-border shadow-soft space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome (ex: Leite, Ovos, Tomates)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="w-full sm:w-52">
            <Select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            >
              <option value="all">Todos os Estados</option>
              <option value="fresh">Fresco</option>
              <option value="frozen">Congelado</option>
            </Select>
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
      </div>

      {/* Grid of Food Items */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredItems.map((item) => (
            <FoodCard
              key={item.id}
              item={item}
              onEdit={onEditItem}
              onDelete={onDeleteItem}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<UtensilsCrossed className="w-8 h-8 text-primary" />}
          title={searchTerm || selectedCategory !== 'all' ? 'Nenhum alimento encontrado' : 'Sua geladeira está vazia'}
          description={
            searchTerm || selectedCategory !== 'all'
              ? 'Tente ajustar os filtros de busca ou adicione novos itens.'
              : 'Comece adicionando itens manualmente ou escaneie as prateleiras com sua câmera!'
          }
          actionLabel="Escanear Geladeira"
          onAction={onNavigateToScanner}
          actionIcon={<Camera className="w-4 h-4 text-white" />}
        />
      )}

      {/* Reset to Demo defaults footer button */}
      <div className="pt-4 flex items-center justify-between border-t border-border text-xs text-text-secondary">
        <span>Exibindo {filteredItems.length} de {inventory.length} alimentos</span>
        <button
          onClick={onResetDefault}
          className="flex items-center gap-1 text-primary hover:text-primary-dark font-medium cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar dados de exemplo</span>
        </button>
      </div>
    </div>
  );
};
