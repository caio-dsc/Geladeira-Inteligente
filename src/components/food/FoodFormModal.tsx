import React, { useState, useEffect } from 'react';
import { FoodItem, CategoryType, FreshnessState, StorageLocation } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Plus, Save, AlertCircle } from 'lucide-react';

export interface FoodFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (foodData: Omit<FoodItem, 'id' | 'addedAt'>) => Promise<void>;
  initialData?: FoodItem | null;
}

export const FoodFormModal: React.FC<FoodFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>('vegetables');
  const [quantityText, setQuantityText] = useState('1');
  const [unit, setUnit] = useState<FoodItem['unit']>('un');
  const [state, setState] = useState<FreshnessState>('fresh');
  const [location, setLocation] = useState<StorageLocation>('geladeira');
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onQuantityFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // seleciona tudo -> qualquer digitação substitui o "1"
    e.target.select();
  };

  const onQuantityChange = (raw: string) => {
    // só dígitos (para unidades inteiras)
    let v = raw.replace(/[^\d]/g, '');

    // remove zeros à esquerda: "09" -> "9", "012" -> "12"
    v = v.replace(/^0+(?=\d)/, '');

    // permite vazio enquanto digita (não força 0)
    setQuantityText(v);
  };

  const onQuantityBlur = () => {
    // ao sair do campo: vazio vira 1
    if (!quantityText.trim()) setQuantityText('1');
  };

  const getQuantityNumber = () => {
    const n = Number(quantityText);
    if (!Number.isFinite(n) || n <= 0) return 1;
    return n;
  };

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCategory(initialData.category);
      setQuantityText(String(initialData.quantity || 1));
      setUnit(initialData.unit);
      setState(initialData.state);
      setLocation(initialData.location);
      setExpirationDate(initialData.expirationDate || '');
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setCategory('vegetables');
      setQuantityText('1');
      setUnit('un');
      setState('fresh');
      setLocation('geladeira');
      setExpirationDate('');
      setNotes('');
    }
    setError('');
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome do alimento.');
      return;
    }
    const quantity = getQuantityNumber();
    if (quantity <= 0) {
      setError('A quantidade deve ser maior que zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        name: name.trim(),
        category,
        quantity,
        unit,
        state,
        location,
        expirationDate: expirationDate || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar o alimento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Alimento' : 'Adicionar Alimento'}
      subtitle={initialData ? 'Atualize as informações do item' : 'Cadastre um item manualmente na sua geladeira'}
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            leftIcon={initialData ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          >
            {initialData ? 'Salvar Alterações' : 'Adicionar à Geladeira'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {error && (
          <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Name */}
        <Input
          label="Nome do Alimento *"
          placeholder="Ex: Maçã Fuji, Queijo Mussarela, Ovos..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* Category & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-emerald-200/90 mb-1.5">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryType)}
              className="w-full rounded-2xl border border-emerald-500/30 bg-[#081e13] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
            >
              <option value="vegetables">Legumes & Verduras</option>
              <option value="fruits">Frutas</option>
              <option value="dairy">Laticínios</option>
              <option value="proteins">Proteínas & Ovos</option>
              <option value="drinks">Bebidas</option>
              <option value="pantry">Despensa</option>
              <option value="condiments">Temperos & Molhos</option>
              <option value="bakery">Pães & Massas</option>
              <option value="other">Outros</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-200/90 mb-1.5">
              Compartimento / Local
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value as StorageLocation)}
              className="w-full rounded-2xl border border-emerald-500/30 bg-[#081e13] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
            >
              <option value="geladeira">Prateleira Principal</option>
              <option value="gaveta_legumes">Gaveta de Hortifrúti</option>
              <option value="porta">Porta da Geladeira</option>
              <option value="freezer">Freezer / Congelador</option>
              <option value="despensa">Despensa</option>
            </select>
          </div>
        </div>

        {/* Quantity & Unit */}
        <div className="grid grid-cols-2 gap-3.5">
          <Input
            label="Quantidade *"
            type="text"
            inputMode="numeric"
            value={quantityText}
            onFocus={onQuantityFocus}
            onChange={(e) => onQuantityChange(e.target.value)}
            onBlur={onQuantityBlur}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-emerald-200/90 mb-1.5">
              Unidade
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as FoodItem['unit'])}
              className="w-full rounded-2xl border border-emerald-500/30 bg-[#081e13] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
            >
              <option value="un">un (unidades)</option>
              <option value="g">g (gramas)</option>
              <option value="kg">kg (quilos)</option>
              <option value="ml">ml (mililitros)</option>
              <option value="l">l (litros)</option>
              <option value="fatias">fatias</option>
              <option value="porções">porções</option>
            </select>
          </div>
        </div>

        {/* Freshness & Expiration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-emerald-200/90 mb-1.5">
              Estado de Frescor
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value as FreshnessState)}
              className="w-full rounded-2xl border border-emerald-500/30 bg-[#081e13] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
            >
              <option value="fresh">Fresco</option>
              <option value="frozen">Congelado</option>
            </select>
          </div>

          <Input
            label="Data de Validade (opcional)"
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
          />
        </div>

        {/* Notes */}
        <Input
          label="Observações (opcional)"
          placeholder="Ex: Aberto ontem, embalagem lacrada..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </form>
    </Modal>
  );
};
