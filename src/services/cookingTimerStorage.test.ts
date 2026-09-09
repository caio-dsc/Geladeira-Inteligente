import assert from 'node:assert/strict';
import {
  StoredCookingSession,
  restoreCookingSession
} from './cookingTimerStorage';

console.log('🧪 Iniciando testes de cookingTimerStorage...');

// 1. Teste de restauração com contagem normal (5 minutos decorridos)
{
  const now = Date.now();
  const totalSeconds = 45 * 60; // 2700s
  const elapsedMs = 5 * 60 * 1000; // 300s
  const startedAt = now - elapsedMs;
  const endAt = startedAt + totalSeconds * 1000; // faltam 2400s a partir de now

  const stored: StoredCookingSession = {
    recipeId: 'rec_1',
    recipeTitle: 'Feijoada',
    totalSeconds,
    remainingSeconds: totalSeconds,
    isRunning: true,
    isCompleted: false,
    startedAt,
    endAt,
  };

  const restored = restoreCookingSession(stored);
  assert.equal(restored.isRunning, true);
  assert.equal(restored.isCompleted, false);
  // Deve ter aproximadamente 2400 segundos (40 minutos) restantes
  assert.ok(restored.remainingSeconds >= 2399 && restored.remainingSeconds <= 2401, `Esperado ~2400s, obtido ${restored.remainingSeconds}s`);
  console.log('✅ SUCESSO: Tempo descontado corretamente com base no timestamp absoluto (5 min passados)');
}

// 2. Teste de restauração quando o tempo acabou enquanto o usuário estava fora
{
  const now = Date.now();
  const totalSeconds = 10 * 60; // 600s
  const elapsedMs = 15 * 60 * 1000; // 900s (passou do tempo)
  const startedAt = now - elapsedMs;
  const endAt = startedAt + totalSeconds * 1000;

  const stored: StoredCookingSession = {
    recipeId: 'rec_2',
    recipeTitle: 'Omelete',
    totalSeconds,
    remainingSeconds: 600,
    isRunning: true,
    isCompleted: false,
    startedAt,
    endAt,
  };

  const restored = restoreCookingSession(stored);
  assert.equal(restored.isRunning, false);
  assert.equal(restored.isCompleted, true);
  assert.equal(restored.remainingSeconds, 0);
  console.log('✅ SUCESSO: Sessão marcada como concluída quando o tempo encerra durante ausência');
}

// 3. Teste de restauração em estado PAUSADO
{
  const now = Date.now();
  const totalSeconds = 45 * 60;
  const pausedRemainingSeconds = 25 * 60 + 30; // 25:30 (1530s)

  const stored: StoredCookingSession = {
    recipeId: 'rec_3',
    recipeTitle: 'Feijoada Pausada',
    totalSeconds,
    remainingSeconds: pausedRemainingSeconds,
    isRunning: false,
    isCompleted: false,
    startedAt: now - 3600000, // 1 hora atrás
    endAt: now - 1800000,
  };

  const restored = restoreCookingSession(stored);
  assert.equal(restored.isRunning, false);
  assert.equal(restored.isCompleted, false);
  assert.equal(restored.remainingSeconds, 1530, 'Deve preservar exatamente 25:30 (1530s) sem alteração');
  console.log('✅ SUCESSO: Estado pausado preserva o tempo exato congelado após reload');
}

// 4. Teste de restauração já concluída anteriormente
{
  const stored: StoredCookingSession = {
    recipeId: 'rec_4',
    recipeTitle: 'Bolo',
    totalSeconds: 1800,
    remainingSeconds: 0,
    isRunning: false,
    isCompleted: true,
    startedAt: 1000,
    endAt: 2000,
  };

  const restored = restoreCookingSession(stored);
  assert.equal(restored.isCompleted, true);
  assert.equal(restored.isRunning, false);
  assert.equal(restored.remainingSeconds, 0);
  console.log('✅ SUCESSO: Sessão concluída permanece concluída sem reiniciar automaticamente');
}

console.log('🎉 Todos os testes de cookingTimerStorage passaram com 100% de sucesso!');
