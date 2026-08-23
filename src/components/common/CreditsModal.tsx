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
        <div className="p-6 bg-gradient-to-b from-[#0e2c1c] to-[#081f13] rounded-3xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-stone-950 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(52,211,153,0.4)]">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="text-4xl font-black text-white tracking-tight">{credits}</div>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mt-1">
            {credits === 1 ? 'Crédito Disponível' : 'Créditos Disponíveis'}
          </p>
          <p className="text-xs text-emerald-300/60 mt-2 max-w-xs mx-auto">
            Cada foto analisada consome 1 crédito do seu saldo para rodar o modelo de visão.
          </p>
        </div>

        {/* Demo Packages */}
        <div className="space-y-3 text-left">
          <h4 className="text-xs font-bold text-emerald-300/80 uppercase tracking-wider">
            Recarga Rápida (Ambiente Demonstração)
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl border border-emerald-500/20 hover:border-emerald-400/60 bg-[#0a2316]/80 hover:bg-[#0d2d1d] transition-all flex flex-col justify-between">
              <div>
                <span className="text-sm font-bold text-white">+5 Créditos</span>
                <p className="text-[11px] text-emerald-300/60 mt-0.5">Para testar novas fotos</p>
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

            <div className="p-4 rounded-2xl border border-emerald-500/20 hover:border-emerald-400/60 bg-[#0a2316]/80 hover:bg-[#0d2d1d] transition-all flex flex-col justify-between">
              <div>
                <span className="text-sm font-bold text-white">+15 Créditos</span>
                <p className="text-[11px] text-emerald-300/60 mt-0.5">Pacote completo</p>
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
