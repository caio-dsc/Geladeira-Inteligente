import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Sparkles, Camera, CheckCircle2, Zap } from 'lucide-react';

export interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credits: number;
  onAddCredits: (amount: number) => Promise<void>;
}

export const CreditsModal: React.FC<CreditsModalProps> = ({
  isOpen,
  onClose,
  credits,
  onAddCredits,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Créditos de Escaneamento"
      subtitle="Utilizados para processar imagens da sua geladeira"
      maxWidth="md"
      footer={
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <div className="space-y-5 text-center">
        {/* Balance Display */}
        <div className="p-6 bg-gradient-to-b from-primary/10 via-surface to-surface-muted rounded-2xl sm:rounded-3xl border border-primary/20 shadow-soft">
          <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto mb-3 shadow-subtle">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="text-4xl font-black text-text-primary tracking-tight">{credits}</div>
          <p className="text-xs font-bold text-primary uppercase tracking-wider mt-1">
            {credits === 1 ? 'Crédito Disponível' : 'Créditos Disponíveis'}
          </p>
          <p className="text-xs text-text-secondary mt-2 max-w-xs mx-auto">
            Cada foto analisada consome 1 crédito do seu saldo para rodar o modelo de visão.
          </p>
        </div>

        {/* Demo Packages */}
        <div className="space-y-3 text-left">
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Recarga Rápida (Ambiente Demonstração)
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl sm:rounded-2xl border border-border hover:border-primary/50 bg-surface hover:bg-surface-muted/60 shadow-subtle transition-all flex flex-col justify-between">
              <div>
                <span className="text-sm font-bold text-text-primary">+5 Créditos</span>
                <p className="text-[11px] text-text-secondary mt-0.5">Para testar novas fotos</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3 w-full text-xs font-bold"
                onClick={async () => {
                  await onAddCredits(5);
                }}
              >
                Adicionar +5
              </Button>
            </div>

            <div className="p-4 rounded-xl sm:rounded-2xl border border-border hover:border-primary/50 bg-surface hover:bg-surface-muted/60 shadow-subtle transition-all flex flex-col justify-between">
              <div>
                <span className="text-sm font-bold text-text-primary">+15 Créditos</span>
                <p className="text-[11px] text-text-secondary mt-0.5">Pacote completo</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                className="mt-3 w-full text-xs font-bold"
                onClick={async () => {
                  await onAddCredits(15);
                }}
              >
                Adicionar +15
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
