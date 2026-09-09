export interface StoredCookingSession {
  recipeId: string;
  recipeTitle: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isCompleted: boolean;
  startedAt: number;
  endAt: number;
}

const STORAGE_KEY = 'geladeira_cooking_session';

/**
 * Recupera a sessão ativa do temporizador salva no localStorage.
 */
export function getStoredCookingSession(userId?: string): StoredCookingSession | null {
  try {
    const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
    const raw = localStorage.getItem(key) || (userId ? localStorage.getItem(STORAGE_KEY) : null);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCookingSession;
    if (!parsed || !parsed.recipeId || typeof parsed.totalSeconds !== 'number') {
      return null;
    }
    return parsed;
  } catch (err) {
    console.error('Erro ao ler sessão do temporizador do localStorage:', err);
    return null;
  }
}

/**
 * Grava a sessão do temporizador no localStorage.
 * NOTA: Deve ser chamado apenas em eventos pontuais (início, pausa, retomada, conclusão, reinício),
 * NUNCA a cada segundo para evitar I/O desnecessário.
 */
export function saveStoredCookingSession(session: StoredCookingSession | null, userId?: string): void {
  try {
    const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
    if (!session) {
      localStorage.removeItem(key);
      if (userId) {
        localStorage.removeItem(STORAGE_KEY);
      }
      return;
    }
    const serialized = JSON.stringify(session);
    localStorage.setItem(key, serialized);
    if (userId) {
      localStorage.setItem(STORAGE_KEY, serialized);
    }
  } catch (err) {
    console.error('Erro ao salvar sessão do temporizador no localStorage:', err);
  }
}

/**
 * Remove a sessão do temporizador do localStorage ao cancelar ou finalizar.
 */
export function clearStoredCookingSession(userId?: string): void {
  try {
    const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
    localStorage.removeItem(key);
    if (userId) {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    console.error('Erro ao limpar sessão do temporizador do localStorage:', err);
  }
}

/**
 * Restaura o estado da sessão após recarregamento da página,
 * calculando o tempo restante real com base nos timestamps absolutos.
 */
export function restoreCookingSession(stored: StoredCookingSession): StoredCookingSession {
  if (stored.isCompleted) {
    return {
      ...stored,
      remainingSeconds: 0,
      isRunning: false,
      isCompleted: true,
    };
  }

  // Se estava pausado, o tempo permaneceu congelado com o valor exato no momento da pausa
  if (!stored.isRunning) {
    return {
      ...stored,
      isRunning: false,
      isCompleted: false,
    };
  }

  // Se estava rodando, calcula o tempo restante com base na diferença entre endAt e o instante atual
  const now = Date.now();
  const remainingMs = stored.endAt - now;
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

  if (remainingSeconds <= 0) {
    return {
      ...stored,
      remainingSeconds: 0,
      isRunning: false,
      isCompleted: true,
    };
  }

  return {
    ...stored,
    remainingSeconds,
    isRunning: true,
    isCompleted: false,
  };
}
