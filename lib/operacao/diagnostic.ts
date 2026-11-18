import { studyDate } from "../gamification-rules";
import type { Discipline } from "./types";

/**
 * Diagnóstico de desempenho: só usa respostas registradas.
 * - "De primeira": acerto na 1ª tentativa de cada questão. No recorte por período, só entra a questão cuja 1ª tentativa caiu no período
 *   (o denominador é `firstAttempts`).
 * - "Atual": resultado da tentativa mais recente dentro do recorte (mostra se o aluno recuperou o erro).
 * Amostra pequena é sinalizada: abaixo de MIN_SAMPLE questões, percentuais oscilam demais para virar conclusão.
 */
export type DiagAttempt = { id: string; history: { ok: boolean; at: string }[] };
export type DiagQuestion = { id: string; discipline: Discipline; topic: string };

export const MIN_SAMPLE = 10;
export type Bucket = { answered: number; firstAttempts: number; firstTry: number; lastOk: number };
export type Rated = { firstTryPct: number | null; lastPct: number | null };
const empty = (): Bucket => ({ answered: 0, firstAttempts: 0, firstTry: 0, lastOk: 0 });

const addDays = (iso: string, amount: number) => {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};
const dayOf = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : studyDate(date);
};
const rate = (value: number, total: number) => (total ? Math.round((value / total) * 100) : null);

/** `windowDays`: recorte em dias terminando hoje (inclusive); `null` = todo o histórico. */
export function diagnose(attempts: DiagAttempt[], questions: DiagQuestion[], today: string, days = 14, windowDays: number | null = null) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const cutoff = windowDays ? addDays(today, -(windowDays - 1)) : null;
  const inWindow = (at: string) => { const day = dayOf(at); return day !== null && (!cutoff || day >= cutoff); };
  const disciplines: Record<string, Bucket> = {};
  const topics = new Map<string, Bucket & { discipline: Discipline; topic: string }>();
  const perDay = new Map<string, number>();
  let answers = 0;

  for (const attempt of attempts) {
    const q = byId.get(attempt.id);
    if (!q || !attempt.history.length) continue;
    for (const h of attempt.history) {
      const day = dayOf(h.at);
      if (day) perDay.set(day, (perDay.get(day) || 0) + 1);
    }
    const entries = attempt.history.filter((h) => inWindow(h.at));
    if (!entries.length) continue;
    answers += entries.length;
    const first = attempt.history[0];
    const firstIn = inWindow(first.at);
    const last = entries[entries.length - 1];
    const add = (b: Bucket) => {
      b.answered += 1;
      if (firstIn) { b.firstAttempts += 1; if (first.ok) b.firstTry += 1; }
      if (last.ok) b.lastOk += 1;
    };
    add((disciplines[q.discipline] ||= empty()));
    const key = `${q.discipline}|${q.topic}`;
    const t = topics.get(key) || { ...empty(), discipline: q.discipline, topic: q.topic };
    add(t);
    topics.set(key, t);
  }

  const withRates = <B extends Bucket>(b: B): B & Rated => ({ ...b, firstTryPct: rate(b.firstTry, b.firstAttempts), lastPct: rate(b.lastOk, b.answered) });
  const list = [...topics.values()].map(withRates);
  // Só aponta ponto fraco/forte com amostra mínima (2 questões), para não rotular o aluno por uma resposta isolada.
  const weak = list.filter((t) => t.answered >= 2 && (t.lastPct ?? 100) < 60).sort((a, b) => (a.lastPct ?? 0) - (b.lastPct ?? 0) || b.answered - a.answered).slice(0, 5);
  const strong = list.filter((t) => t.answered >= 2 && (t.lastPct ?? 0) >= 80).sort((a, b) => (b.lastPct ?? 0) - (a.lastPct ?? 0) || b.answered - a.answered).slice(0, 5);
  const series = Array.from({ length: days }, (_, index) => {
    const key = addDays(today, -(days - 1 - index));
    return { date: key, answers: perDay.get(key) || 0 };
  });
  const sum = (pick: (b: Bucket) => number) => Object.values(disciplines).reduce((total, b) => total + pick(b), 0);
  const total = sum((b) => b.answered);
  const firstAttempts = sum((b) => b.firstAttempts);
  return {
    total,
    answers,
    firstAttempts,
    sampleTooSmall: total < MIN_SAMPLE,
    windowDays,
    firstTryPct: rate(sum((b) => b.firstTry), firstAttempts),
    lastPct: rate(sum((b) => b.lastOk), total),
    disciplines: Object.fromEntries(Object.entries(disciplines).map(([k, b]) => [k, withRates(b)])) as Record<string, Bucket & Rated>,
    weak,
    strong,
    series,
  };
}
