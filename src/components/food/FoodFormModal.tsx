import React, { useState, useEffect } from 'react';
import { FoodItem, CategoryType, FreshnessState, StorageLocation } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
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
          <div className="p-3 rounded-xl bg-red-50/80 border border-danger/30 text-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-danger shrink-0" />
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
          <Select
            label="Categoria"
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryType)}
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
          </Select>

          <Select
            label="Compartimento / Local"
            value={location}
            onChange={(e) => setLocation(e.target.value as StorageLocation)}
          >
            <option value="geladeira">Prateleira Principal</option>
            <option value="gaveta_legumes">Gaveta de Hortifrúti</option>
            <option value="porta">Porta da Geladeira</option>
            <option value="freezer">Freezer / Congelador</option>
            <option value="despensa">Despensa</option>
          </Select>
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

          <Select
            label="Unidade"
            value={unit}
            onChange={(e) => setUnit(e.target.value as FoodItem['unit'])}
          >
            <option value="un">un (unidades)</option>
            <option value="g">g (gramas)</option>
            <option value="kg">kg (quilos)</option>
            <option value="ml">ml (mililitros)</option>
            <option value="l">l (litros)</option>
            <option value="fatias">fatias</option>
            <option value="porções">porções</option>
          </Select>
        </div>

        {/* Freshness & Expiration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Select
            label="Estado de Frescor"
            value={state}
            onChange={(e) => setState(e.target.value as FreshnessState)}
          >
            <option value="fresh">Fresco</option>
            <option value="frozen">Congelado</option>
          </Select>

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
