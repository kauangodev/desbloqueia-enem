import { studyDate } from "../gamification-rules";
import type { Discipline } from "./types";

/**
 * Diagnóstico de desempenho: só usa respostas registradas. "De primeira" é o acerto na 1ª tentativa de cada questão
 * (a métrica mais honesta); "última" é o resultado da tentativa mais recente (mostra se o aluno recuperou o erro).
 */
export type DiagAttempt = { id: string; history: { ok: boolean; at: string }[] };
export type DiagQuestion = { id: string; discipline: Discipline; topic: string };

export type Bucket = { answered: number; firstTry: number; lastOk: number };
const empty = (): Bucket => ({ answered: 0, firstTry: 0, lastOk: 0 });

export function diagnose(attempts: DiagAttempt[], questions: DiagQuestion[], today: string, days = 14) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const disciplines: Record<string, Bucket> = {};
  const topics = new Map<string, Bucket & { discipline: Discipline; topic: string }>();
  const perDay = new Map<string, number>();
  for (const attempt of attempts) {
    const q = byId.get(attempt.id);
    if (!q || !attempt.history.length) continue;
    const first = attempt.history[0];
    const last = attempt.history[attempt.history.length - 1];
    const d = (disciplines[q.discipline] ||= empty());
    d.answered += 1; if (first.ok) d.firstTry += 1; if (last.ok) d.lastOk += 1;
    const key = `${q.discipline}|${q.topic}`;
    const t = topics.get(key) || { ...empty(), discipline: q.discipline, topic: q.topic };
    t.answered += 1; if (first.ok) t.firstTry += 1; if (last.ok) t.lastOk += 1;
    topics.set(key, t);
    for (const h of attempt.history) {
      const date = new Date(h.at);
      if (Number.isNaN(date.getTime())) continue;
      const day = studyDate(date);
      perDay.set(day, (perDay.get(day) || 0) + 1);
    }
  }
  const rate = (value: number, total: number) => (total ? Math.round((value / total) * 100) : null);
  const list = [...topics.values()].map((t) => ({ ...t, firstTryPct: rate(t.firstTry, t.answered), lastPct: rate(t.lastOk, t.answered) }));
  // Só aponta ponto fraco com amostra mínima (2 questões), para não rotular o aluno por uma resposta isolada.
  const weak = list.filter((t) => t.answered >= 2 && (t.lastPct ?? 100) < 60).sort((a, b) => (a.lastPct ?? 0) - (b.lastPct ?? 0) || b.answered - a.answered).slice(0, 5);
  const strong = list.filter((t) => t.answered >= 2 && (t.lastPct ?? 0) >= 80).sort((a, b) => (b.lastPct ?? 0) - (a.lastPct ?? 0) || b.answered - a.answered).slice(0, 5);
  const date = new Date(`${today}T12:00:00Z`);
  const series = Array.from({ length: days }, (_, index) => {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() - (days - 1 - index));
    const key = d.toISOString().slice(0, 10);
    return { date: key, answers: perDay.get(key) || 0 };
  });
  const total = Object.values(disciplines).reduce((sum, b) => sum + b.answered, 0);
  const firstTry = Object.values(disciplines).reduce((sum, b) => sum + b.firstTry, 0);
  const lastOk = Object.values(disciplines).reduce((sum, b) => sum + b.lastOk, 0);
  return {
    total,
    firstTryPct: rate(firstTry, total),
    lastPct: rate(lastOk, total),
    disciplines: Object.fromEntries(Object.entries(disciplines).map(([k, b]) => [k, { ...b, firstTryPct: rate(b.firstTry, b.answered), lastPct: rate(b.lastOk, b.answered) }])) as Record<string, Bucket & { firstTryPct: number | null; lastPct: number | null }>,
    weak,
    strong,
    series,
  };
}
