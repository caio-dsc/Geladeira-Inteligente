import React, { useState, useEffect } from 'react';
import { ShoppingList } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { ShoppingCart, AlertCircle } from 'lucide-react';

export interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; shoppingDate?: string; shoppingTime?: string }) => Promise<void>;
  initialData?: ShoppingList | null;
}

export const ShoppingListModal: React.FC<ShoppingListModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [shoppingDate, setShoppingDate] = useState('');
  const [shoppingTime, setShoppingTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '');
        setShoppingDate(initialData.shoppingDate || '');
        setShoppingTime(initialData.shoppingTime || '');
      } else {
        setTitle('');
        setShoppingDate('');
        setShoppingTime('');
      }
      setError('');
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Por favor, informe um título para a lista.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        title: title.trim(),
        shoppingDate: shoppingDate || undefined,
        shoppingTime: shoppingTime || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar a lista de compras.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Lista de Mercado' : 'Nova Lista de Mercado'}
      maxWidth="md"
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
            Nome da Lista *
          </label>
          <Input
            placeholder="Ex: Compras da Semana, Churrasco, Feira..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            leftIcon={<ShoppingCart className="w-4 h-4" />}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Data Prevista (Opcional)
            </label>
            <Input
              type="date"
              value={shoppingDate}
              onChange={(e) => setShoppingDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Horário (Opcional)
            </label>
            <Input
              type="time"
              value={shoppingTime}
              onChange={(e) => setShoppingTime(e.target.value)}
            />
          </div>
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
            {initialData ? 'Atualizar Lista' : 'Criar Lista'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
