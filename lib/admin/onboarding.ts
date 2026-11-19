import "server-only";
import type { RowDataPacket } from "mysql2/promise";
import { mysqlPool } from "../mysql";

/**
 * Métricas do onboarding (estado em `operacao_state`, kind "onboarding"). Não lê nem devolve respostas pessoais: só contagens por etapa.
 * Retorna null se a consulta falhar (a tela mostra "indisponível", nunca zero).
 */
export type OnboardingStats = { started: number; completed: number; stoppedAt: { 1: number; 2: number; 3: number } };

export async function onboardingStats(): Promise<OnboardingStats | null> {
  try {
    const [rows] = await mysqlPool().query<RowDataPacket[]>(
      `SELECT JSON_UNQUOTE(JSON_EXTRACT(s.data, '$.completedAt')) IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(s.data, '$.completedAt')) <> 'null' AS done,
              CAST(JSON_UNQUOTE(JSON_EXTRACT(s.data, '$.step')) AS UNSIGNED) AS step, COUNT(*) AS n
       FROM operacao_state s JOIN users u ON u.id = s.user_id
       WHERE s.kind = 'onboarding' AND u.role = 'student' GROUP BY done, step`,
    );
    const stats: OnboardingStats = { started: 0, completed: 0, stoppedAt: { 1: 0, 2: 0, 3: 0 } };
    for (const r of rows) {
      const n = Number(r.n);
      stats.started += n;
      if (Number(r.done)) stats.completed += n;
      else { const step = Math.min(3, Math.max(1, Number(r.step) || 1)) as 1 | 2 | 3; stats.stoppedAt[step] += n; }
    }
    return stats;
  } catch { return null; }
}
