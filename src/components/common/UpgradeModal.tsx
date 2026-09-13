import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Camera, Sparkles, CheckCircle2, MessageCircle, Mail, Plus, UtensilsCrossed, ShieldCheck, Zap } from 'lucide-react';

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFoodModal?: () => void;
  onNavigateToInventory?: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onOpenFoodModal,
  onNavigateToInventory,
}) => {
  const [showContactDetails, setShowContactDetails] = useState(false);

  const handleClose = () => {
    setShowContactDetails(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reconhecimento por imagem"
      subtitle="Inteligência Artificial para sua Geladeira Inteligente"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Fechar
          </Button>

          {onOpenFoodModal && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleClose();
                onOpenFoodModal();
              }}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Adicionar Alimento Manual
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-5 text-center">
        {/* Ícone Hero */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-primary/20 via-primary/10 to-emerald-500/10 text-primary border border-primary/20 flex items-center justify-center mx-auto shadow-subtle">
          <Camera className="w-8 h-8" />
        </div>

        {/* Mensagens principais (FASE 13) */}
        <div className="space-y-2">
          <h3 className="text-xl font-black text-text-primary tracking-tight">
            Reconhecimento por imagem
          </h3>
          <p className="text-sm sm:text-base font-semibold text-text-primary leading-snug">
            O reconhecimento automático da geladeira está disponível no plano completo.
          </p>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-md mx-auto">
            Você pode continuar adicionando alimentos manualmente gratuitamente.
          </p>
        </div>

        {/* Vantagens do Plano Completo */}
        <div className="p-4 rounded-2xl bg-surface-muted/60 border border-border text-left space-y-2.5">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            O que você recebe no Plano Completo:
          </p>
          <ul className="space-y-2 text-xs text-text-primary">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Scan Ilimitado</strong>: fotografe sua geladeira quantas vezes quiser</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Visão Computacional com IA</strong>: detecção de itens e estimativa de validade</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Economia de tempo</strong>: cadastre dezenas de alimentos em segundos</span>
            </li>
          </ul>
        </div>

        {/* Botão de Ação ou Detalhes de Contato */}
        {!showContactDetails ? (
          <div className="space-y-3 pt-1">
            <Button
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-soft"
              onClick={() => setShowContactDetails(true)}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Conhecer o acesso completo
            </Button>

            {onNavigateToInventory && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  handleClose();
                  onNavigateToInventory();
                }}
                leftIcon={<UtensilsCrossed className="w-3.5 h-3.5" />}
              >
                Continuar usando Minha Geladeira (Gratuito)
              </Button>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-left space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-bold text-text-primary">
                Como liberar o Scan Ilimitado:
              </h4>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Após confirmar o pagamento com o administrador, seu e-mail será liberado diretamente no painel. O acesso ao reconhecimento por imagem se tornará <strong>ilimitado</strong> imediatamente.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <a
                href="mailto:b75282353@gmail.com?subject=Liberar%20Scan%20Ilimitado%20-%20Geladeira%20Inteligente"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-subtle hover:bg-primary-hover transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Contatar Administrador</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
