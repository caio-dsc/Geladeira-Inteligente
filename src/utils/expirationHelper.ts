/**
 * expirationHelper.ts
 * Utilitário para cálculo dinâmico do controle de validade dos alimentos.
 * Considera datas de calendário no fuso local do usuário sem desvios UTC.
 */

export type ExpirationStatus = 'normal' | 'notice' | 'warning' | 'alert' | 'expired';

export interface ExpirationInfo {
  diffDays: number;
  label: string;
  status: ExpirationStatus;
  badgeClass: string;
}

/**
 * Calcula a diferença em dias entre a data de hoje e a data de vencimento.
 * Utiliza partes de calendário (ano, mês, dia) locais para evitar desvios causados por fuso horário.
 * 
 * Regras:
 * - > 3 dias: "Faltam X dias para vencer" (Estado normal)
 * - 3 dias: "Faltam 3 dias para vencer" (Maior destaque)
 * - 2 dias: "Faltam 2 dias para vencer" (Estado de atenção)
 * - 1 dia: "Falta 1 dia para vencer" (Estado de atenção forte)
 * - 0 dias: "Vence hoje" (Estado de alerta)
 * - < 0 dias: "Vencido há 1 dia" / "Vencido há X dias" (Estado de vencido)
 */
export function getExpirationInfo(rawDate?: string | null, referenceDate = new Date()): ExpirationInfo | null {
  if (!rawDate || typeof rawDate !== 'string' || !rawDate.trim()) {
    return null;
  }

  const trimmed = rawDate.trim();

  // Tenta extrair YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  let year: number;
  let month: number;
  let day: number;

  if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    month = parseInt(isoMatch[2], 10) - 1; // 0-indexed
    day = parseInt(isoMatch[3], 10);
  } else {
    // Tenta formato DD/MM/YYYY
    const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (brMatch) {
      day = parseInt(brMatch[1], 10);
      month = parseInt(brMatch[2], 10) - 1;
      year = parseInt(brMatch[3], 10);
    } else {
      const parsed = new Date(trimmed);
      if (isNaN(parsed.getTime())) return null;
      year = parsed.getFullYear();
      month = parsed.getMonth();
      day = parsed.getDate();
    }
  }

  // Normaliza ambas as datas para o início do dia no fuso horário local
  const todayCalendar = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  ).getTime();

  const targetCalendar = new Date(year, month, day).getTime();

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((targetCalendar - todayCalendar) / MS_PER_DAY);

  // Estados visuais alinhados ao Spatial UI 2D com alto contraste e visibilidade
  if (diffDays > 3) {
    return {
      diffDays,
      label: `Faltam ${diffDays} dias para vencer`,
      status: 'normal',
      badgeClass: 'bg-surface-muted text-text-primary font-medium border border-border',
    };
  }

  if (diffDays === 3) {
    return {
      diffDays,
      label: 'Faltam 3 dias para vencer',
      status: 'notice',
      badgeClass: 'bg-amber-100 text-amber-950 font-semibold border border-amber-300',
    };
  }

  if (diffDays === 2) {
    return {
      diffDays,
      label: 'Falta 2 dias para vencer',
      status: 'warning',
      badgeClass: 'bg-amber-300 text-amber-950 font-bold border border-amber-400 shadow-xs',
    };
  }

  if (diffDays === 1) {
    return {
      diffDays,
      label: 'Falta 1 dia para vencer',
      status: 'alert',
      badgeClass: 'bg-orange-600 text-white font-bold border border-orange-700 shadow-xs',
    };
  }

  if (diffDays === 0) {
    return {
      diffDays,
      label: 'Vence hoje',
      status: 'alert',
      badgeClass: 'bg-red-600 text-white font-bold border border-red-700 shadow-xs',
    };
  }

  // Vencido (diffDays < 0)
  const absDays = Math.abs(diffDays);
  const label = absDays === 1 ? 'Vencido há 1 dia' : `Vencido há ${absDays} dias`;
  return {
    diffDays,
    label,
    status: 'expired',
    badgeClass: 'bg-red-600 text-white font-bold border border-red-700 shadow-xs',
  };
}
