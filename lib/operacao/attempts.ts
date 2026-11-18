import type { Attempt } from "./engine";
import type { Kv } from "./store";

/**
 * Grava uma tentativa de questão (compartilhada por Banco, Caderno, Treino rápido, simulados e Trilha). A 1ª tentativa define
 * `firstTryCorrect` (base de XP e diagnóstico); as demais são retentativas registradas no histórico (até 40).
 */
export async function recordAttempt(kv: Kv, questionId: string, selected: string, ok: boolean, mode: string, now: Date = new Date()) {
  const current = (await kv.get<Attempt>("attempt", questionId)) || { history: [], firstTryCorrect: null };
  const afterResolution = current.history.length > 0; // a resolução já foi exibida na tentativa anterior
  current.history.push({ sel: selected, ok, at: now.toISOString(), mode, afterResolution });
  if (current.history.length === 1) current.firstTryCorrect = ok;
  if (current.history.length > 40) current.history = current.history.slice(-40);
  await kv.set("attempt", questionId, current);
  return current;
}
