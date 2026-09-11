import React, { useState } from 'react';
import { ShoppingList, ShoppingListItem } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CheckCheck, UtensilsCrossed, AlertCircle, ShoppingBag } from 'lucide-react';
import { getCategoryLabel } from '../food/FoodCard';

export interface FinalizePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: ShoppingList;
  onConfirm: (options: { sendOnlyCompleted: boolean }) => Promise<void>;
}

export const FinalizePurchaseModal: React.FC<FinalizePurchaseModalProps> = ({
  isOpen,
  onClose,
  list,
  onConfirm,
}) => {
  const [sendOnlyCompleted, setSendOnlyCompleted] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const completedItems = list.items.filter((i) => i.completed);
  const targetItems = sendOnlyCompleted ? completedItems : list.items;

  const handleConfirm = async () => {
    if (targetItems.length === 0) {
      setError('Não há itens selecionados para transferir.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onConfirm({ sendOnlyCompleted });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao finalizar a compra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Finalizar Compra"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
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
            type="button"
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            isLoading={isSubmitting}
            disabled={targetItems.length === 0}
            leftIcon={<UtensilsCrossed className="w-4 h-4" />}
          >
            Transferir para Geladeira
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-left">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-start gap-3 p-3.5 bg-primary/5 rounded-2xl border border-primary/20">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary mt-0.5">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary">
              Enviar para Minha Geladeira
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed mt-0.5">
              Os itens adquiridos serão integrados automaticamente ao estoque da sua geladeira/despensa, prontos para sugerir receitas!
            </p>
          </div>
        </div>

        {/* Option Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Itens a serem transferidos:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setSendOnlyCompleted(true);
                setError('');
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                sendOnlyCompleted
                  ? 'border-primary bg-primary/10 shadow-subtle'
                  : 'border-border bg-surface hover:bg-surface-muted'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">Apenas Comprados</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                  {completedItems.length} itens
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mt-1">
                Itens marcados no checklist do carrinho.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setSendOnlyCompleted(false);
                setError('');
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                !sendOnlyCompleted
                  ? 'border-primary bg-primary/10 shadow-subtle'
                  : 'border-border bg-surface hover:bg-surface-muted'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">Todos da Lista</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary">
                  {list.items.length} itens
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mt-1">
                Transfere a lista completa para o estoque.
              </p>
            </button>
          </div>
        </div>

        {/* Item Preview */}
        <div>
          <span className="text-xs font-semibold text-text-secondary">
            Prévia dos alimentos ({targetItems.length}):
          </span>
          <div className="mt-2 max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {targetItems.length > 0 ? (
              targetItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-3 py-2 bg-surface-muted/60 rounded-xl text-xs border border-border/60"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">{item.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white border border-border text-text-secondary">
                      {getCategoryLabel(item.category)}
                    </span>
                  </div>
                  <span className="font-bold text-primary">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-text-secondary bg-surface-muted/40 rounded-xl">
                Nenhum item marcado como comprado no checklist desta lista.
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
