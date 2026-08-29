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
    case 'vegetables': return <Carrot className="w-4 h-4 text-emerald-400" />;
    case 'fruits': return <Apple className="w-4 h-4 text-emerald-300" />;
    case 'dairy': return <Milk className="w-4 h-4 text-cyan-300" />;
    case 'proteins': return <Egg className="w-4 h-4 text-amber-300" />;
    case 'drinks': return <Coffee className="w-4 h-4 text-teal-300" />;
    case 'pantry': return <Package className="w-4 h-4 text-emerald-200" />;
    case 'condiments': return <Flame className="w-4 h-4 text-orange-400" />;
    case 'bakery': return <Croissant className="w-4 h-4 text-yellow-300" />;
    default: return <HelpCircle className="w-4 h-4 text-emerald-300" />;
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
        classes: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
        dot: 'bg-emerald-400',
      };
    case 'frozen':
      return {
        label: 'Congelado',
        classes: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]',
        dot: 'bg-cyan-400',
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
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/25 text-xs font-semibold text-emerald-200">
            {getCategoryIcon(item.category)}
            <span className="text-[11px] truncate max-w-[110px]">{getCategoryLabel(item.category)}</span>
          </div>

          <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${freshness.classes}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${freshness.dot}`} />
            <span>{freshness.label}</span>
          </div>
        </div>

        {/* Item Title & Quantity */}
        <div className="mt-1">
          <h4 className="text-base font-extrabold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
            {item.name}
          </h4>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-lg font-black text-emerald-400">
              {item.quantity}
            </span>
            <span className="text-xs text-emerald-300/70 font-semibold">{item.unit}</span>
          </div>
        </div>

        {/* Location & Expiration info */}
        <div className="mt-3 pt-2.5 border-t border-emerald-500/15 space-y-1.5 text-xs text-emerald-300/70">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{getLocationLabel(item.location)}</span>
          </div>

          {item.expirationDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Validade: {new Date(item.expirationDate).toLocaleDateString('pt-BR')}</span>
            </div>
          )}

          {item.notes && (
            <p className="text-[11px] text-emerald-400/60 italic truncate mt-1">
              "{item.notes}"
            </p>
          )}
        </div>
      </div>

      {/* Action buttons (hover or mobile visible) */}
      <div className="mt-3.5 pt-2 border-t border-emerald-500/15 flex items-center justify-end gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/40 transition-colors"
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
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/50 transition-colors"
            title="Excluir item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </Card>
  );
};
