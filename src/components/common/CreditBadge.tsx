import React from 'react';
import { Lock, CheckCircle2 } from 'lucide-react';

export interface CreditBadgeProps {
  scanEnabled?: boolean;
  credits?: number;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export const ScanStatusBadge: React.FC<CreditBadgeProps> = ({
  scanEnabled = false,
  onClick,
  size = 'md',
}) => {
  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-1 text-xs gap-1.5'
      : 'px-3.5 py-1.5 text-xs sm:text-sm gap-2';

  if (scanEnabled) {
    return (
      <div
        onClick={onClick}
        className={`inline-flex items-center font-medium rounded-full transition-all duration-200 ${sizeClasses} bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-subtle ${
          onClick ? 'cursor-pointer hover:bg-emerald-100' : 'cursor-default'
        }`}
        title="Reconhecimento por Imagem Liberado (Scan Ilimitado)"
      >
        <div className="w-4 h-4 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-700 shrink-0">
          <CheckCircle2 className="w-3 h-3 shrink-0" />
        </div>
        <span className="font-bold text-emerald-900">Scan Liberado</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center font-medium rounded-full transition-all duration-200 ${sizeClasses} bg-amber-50 text-amber-800 border border-amber-200/90 shadow-subtle ${
        onClick ? 'cursor-pointer hover:bg-amber-100' : 'cursor-default'
      }`}
      title="Conta Gratuita: Recursos manuais liberados, Scan IA no plano completo"
    >
      <div className="w-4 h-4 rounded-full flex items-center justify-center bg-amber-100 text-amber-700 shrink-0">
        <Lock className="w-3 h-3 shrink-0" />
      </div>
      <span className="font-bold text-amber-900">Conta Gratuita</span>
    </div>
  );
};

export const CreditBadge = ScanStatusBadge;

