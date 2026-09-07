import React from 'react';
import { FoodItem, CategoryType, FreshnessState } from '../../types';
import { 
  Apple, 
  Carrot, 
  Milk, 
  Egg, 
  Coffee, 
  Package, 
  Flame, 
  Croissant, 
  HelpCircle, 
  Pencil, 
  Trash2, 
  Calendar,
  MapPin
} from 'lucide-react';
import { Card } from '../common/Card';

export interface FoodCardProps {
  item: FoodItem;
  onEdit?: (item: FoodItem) => void;
  onDelete?: (id: string) => void;
}

export const getCategoryIcon = (category: CategoryType) => {
  switch (category) {
    case 'vegetables': return <Carrot className="w-4 h-4 text-emerald-600" />;
    case 'fruits': return <Apple className="w-4 h-4 text-emerald-600" />;
    case 'dairy': return <Milk className="w-4 h-4 text-sky-600" />;
    case 'proteins': return <Egg className="w-4 h-4 text-amber-600" />;
    case 'drinks': return <Coffee className="w-4 h-4 text-teal-600" />;
    case 'pantry': return <Package className="w-4 h-4 text-stone-600" />;
    case 'condiments': return <Flame className="w-4 h-4 text-orange-600" />;
    case 'bakery': return <Croissant className="w-4 h-4 text-yellow-600" />;
    default: return <HelpCircle className="w-4 h-4 text-emerald-600" />;
  }
};

export const getCategoryLabel = (category: CategoryType): string => {
  const map: Record<CategoryType, string> = {
    vegetables: 'Legumes & Verduras',
    fruits: 'Frutas',
    dairy: 'Laticínios',
    proteins: 'Proteínas & Ovos',
    drinks: 'Bebidas',
    pantry: 'Despensa',
    condiments: 'Temperos & Molhos',
    bakery: 'Pães & Massas',
    other: 'Outros',
  };
  return map[category] || 'Outros';
};

export const getFreshnessBadge = (state: FreshnessState) => {
  switch (state) {
    case 'fresh':
      return {
        label: 'Fresco',
        classes: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
        dot: 'bg-emerald-500',
      };
    case 'frozen':
      return {
        label: 'Congelado',
        classes: 'bg-sky-50 text-sky-800 border-sky-200/80',
        dot: 'bg-sky-500',
      };
  }
};

export const getLocationLabel = (loc: string): string => {
  const map: Record<string, string> = {
    geladeira: 'Prateleira',
    freezer: 'Freezer',
    gaveta_legumes: 'Gaveta Hortifrúti',
    porta: 'Porta',
    despensa: 'Despensa',
  };
  return map[loc] || 'Geladeira';
};

export const FoodCard: React.FC<FoodCardProps> = ({ item, onEdit, onDelete }) => {
  const freshness = getFreshnessBadge(item.state);

  return (
    <Card variant="interactive" padding="sm" className="relative group flex flex-col justify-between">
      <div>
        {/* Top bar with Category icon and Freshness tag */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-muted border border-border text-xs font-medium text-text-primary">
            {getCategoryIcon(item.category)}
            <span className="text-[11px] truncate max-w-[110px]">{getCategoryLabel(item.category)}</span>
          </div>

          <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${freshness.classes}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${freshness.dot}`} />
            <span>{freshness.label}</span>
          </div>
        </div>

        {/* Item Title & Quantity */}
        <div className="mt-1 text-left">
          <h4 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-1">
            {item.name}
          </h4>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-lg font-black text-primary">
              {item.quantity}
            </span>
            <span className="text-xs text-text-secondary font-medium">{item.unit}</span>
          </div>
        </div>

        {/* Location & Expiration info */}
        <div className="mt-3 pt-2.5 border-t border-border space-y-1.5 text-xs text-text-secondary text-left">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">{getLocationLabel(item.location)}</span>
          </div>

          {item.expirationDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Validade: {new Date(item.expirationDate).toLocaleDateString('pt-BR')}</span>
            </div>
          )}

          {item.notes && (
            <p className="text-[11px] text-text-secondary/70 italic truncate mt-1">
              "{item.notes}"
            </p>
          )}
        </div>
      </div>

      {/* Action buttons (hover or mobile visible) */}
      <div className="mt-3.5 pt-2 border-t border-border flex items-center justify-end gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-surface-muted transition-colors cursor-pointer"
            title="Editar item"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-red-50 transition-colors cursor-pointer"
            title="Excluir item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </Card>
  );
};
