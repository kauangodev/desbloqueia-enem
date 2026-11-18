import { studyDate, summarizeStudyDays } from "../gamification-rules";

/**
 * Frequência real de estudo para o CRM. "Dia ativo de estudo" = dia (America/Sao_Paulo) com atividade pedagógica persistida:
 * resposta de questão, módulo concluído ou treino/simulado finalizado. Login, refresh e visita a páginas NÃO contam
 * (ficam em `last_login_at`, métrica de uso separada). Mesma regra de `lib/operacao/momentum.ts`.
 */
export type ActivityInput = { answerTimes: string[]; moduleTimes: string[]; sessionTimes: string[] };
export type Frequency = { activeDays: string[]; active7: number; active30: number; totalDays: number; streak: number; lastStudyDay: string | null; hasData: boolean };

const addDays = (iso: string, amount: number) => {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};
const dayOf = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? null : studyDate(d); };

export function frequency(input: ActivityInput, today: string): Frequency {
  const all = [...input.answerTimes, ...input.moduleTimes, ...input.sessionTimes].map(dayOf).filter((d): d is string => d !== null);
  const activeDays = [...new Set(all)].sort();
  const within = (n: number) => activeDays.filter((d) => d >= addDays(today, -(n - 1)) && d <= today).length;
  return { activeDays, active7: within(7), active30: within(30), totalDays: activeDays.length, streak: summarizeStudyDays(all, today).streak, lastStudyDay: activeDays[activeDays.length - 1] ?? null, hasData: activeDays.length > 0 };
}

/** Lê os instantes das linhas de `operacao_state` (kind attempt/session/read), tolerando JSON inválido sem quebrar a lista. */
export function activityFromRows(rows: { kind: string; data: unknown }[]): ActivityInput {
  const out: ActivityInput = { answerTimes: [], moduleTimes: [], sessionTimes: [] };
  for (const row of rows) {
    let data: unknown = row.data;
    if (typeof data === "string") { try { data = JSON.parse(data); } catch { continue; } }
    const value = data as { history?: { at?: string }[]; finishedAt?: string; concluded?: boolean; at?: string } | null;
    if (!value) continue;
    if (row.kind === "attempt") {
      for (const h of value.history ?? []) if (h.at) out.answerTimes.push(h.at);
    } else if (row.kind === "session") {
      if (value.finishedAt) out.sessionTimes.push(value.finishedAt);
    } else if (row.kind === "read") {
      if (value.concluded && value.at) out.moduleTimes.push(value.at);
    }
  }
  return out;
}

/** Conversão do Grátis para pago por coorte: denominador = cadastros verificados no período; numerador = quem teve 1ª compra confirmada. */
export function conversion(cohort: { userId: string; firstPaidAt: string | null }[]) {
  const total = cohort.length;
  const paid = cohort.filter((c) => c.firstPaidAt).length;
  return { total, paid, rate: total ? Math.round((paid / total) * 1000) / 10 : null };
}
