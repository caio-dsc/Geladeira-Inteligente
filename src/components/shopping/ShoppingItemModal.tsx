import React, { useState, useEffect } from 'react';
import { ShoppingListItem, CategoryType } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Tag, DollarSign, Package, AlertCircle } from 'lucide-react';

export interface ShoppingItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Omit<ShoppingListItem, 'id'>) => Promise<void>;
  initialData?: ShoppingListItem | null;
}

export const ShoppingItemModal: React.FC<ShoppingItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>('vegetables');
  const [quantityText, setQuantityText] = useState('1');
  const [unit, setUnit] = useState<ShoppingListItem['unit']>('un');
  const [priceText, setPriceText] = useState('0');
  const [completed, setCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setCategory(initialData.category || 'other');
        setQuantityText(String(initialData.quantity || 1));
        setUnit(initialData.unit || 'un');
        setPriceText(String(initialData.price || 0));
        setCompleted(Boolean(initialData.completed));
      } else {
        setName('');
        setCategory('vegetables');
        setQuantityText('1');
        setUnit('un');
        setPriceText('0');
        setCompleted(false);
      }
      setError('');
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome do item.');
      return;
    }

    const qty = Math.max(1, parseFloat(quantityText.replace(',', '.')) || 1);
    const price = Math.max(0, parseFloat(priceText.replace(',', '.')) || 0);

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        name: name.trim(),
        category,
        quantity: qty,
        unit,
        price,
        completed,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar o item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Item da Lista' : 'Adicionar Item'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
            Nome do Alimento *
          </label>
          <Input
            placeholder="Ex: Leite Integral, Arroz, Ovos..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<Package className="w-4 h-4" />}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
            Categoria
          </label>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryType)}
          >
            <option value="vegetables">Legumes & Verduras</option>
            <option value="fruits">Frutas</option>
            <option value="dairy">Laticínios</option>
            <option value="proteins">Proteínas & Carnes</option>
            <option value="drinks">Bebidas</option>
            <option value="pantry">Despensa & Grãos</option>
            <option value="bakery">Padaria & Pães</option>
            <option value="condiments">Condimentos & Molhos</option>
            <option value="other">Outros</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Quantidade
            </label>
            <Input
              type="number"
              step="any"
              min="0.1"
              value={quantityText}
              onChange={(e) => setQuantityText(e.target.value)}
              onFocus={(e) => e.target.select()}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Unidade
            </label>
            <Select
              value={unit}
              onChange={(e) => setUnit(e.target.value as ShoppingListItem['unit'])}
            >
              <option value="un">un (Unidade)</option>
              <option value="kg">kg (Quilo)</option>
              <option value="g">g (Grama)</option>
              <option value="L">L (Litro)</option>
              <option value="ml">ml (Mililitro)</option>
              <option value="pct">pct (Pacote)</option>
              <option value="fatias">fatias</option>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
            Preço Estimado (R$ unitário)
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={priceText}
            onChange={(e) => setPriceText(e.target.value)}
            onFocus={(e) => e.target.select()}
            leftIcon={<DollarSign className="w-4 h-4 text-primary" />}
          />
          <p className="text-[11px] text-text-secondary mt-1">
            Subtotal calculado: R$ {(
              (parseFloat(quantityText.replace(',', '.')) || 0) *
              (parseFloat(priceText.replace(',', '.')) || 0)
            ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
          >
            {initialData ? 'Atualizar Item' : 'Salvar Item'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
