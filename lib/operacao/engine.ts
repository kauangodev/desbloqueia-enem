import { operacao } from "./config";
import { isSimulado, sessionKinds, type KindDef, type SessionKind } from "./kinds";
import { questions, questionById } from "./catalog";
import type { Discipline, Question } from "./types";

export type { SessionKind } from "./kinds";
export type SessionMode = "prova" | "pratica" | "cronometrado" | "livre";

export type Session = {
  id: string;
  kind: SessionKind;
  mode: SessionMode;
  questionIds: string[];
  answers: Record<string, string>;
  flags: Record<string, boolean>;
  startedAt: string;
  limitMs: number | null;
  finishedAt?: string;
  expired?: boolean;
  result?: SessionResult;
};

export type SessionResult = {
  total: number;
  answered: number;
  blank: number;
  correct: number;
  percent: number;
  byDiscipline: Record<string, { total: number; correct: number; blank: number }>;
  byTopic: Record<string, { total: number; correct: number }>;
  weakTopics: string[];
  elapsedMs: number;
};

export type Attempt = { history: { sel: string; ok: boolean; at: string; mode: string; afterResolution: boolean }[]; firstTryCorrect: boolean | null };

const hash = (text: string) => { let h = 2166136261; for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/** Ordena preferindo itens ainda não vistos; desempate estável por hash da semente. */
function ranked(pool: Question[], seed: string, seen: Set<string>) {
  return [...pool].sort((a, b) => Number(seen.has(a.id)) - Number(seen.has(b.id)) || hash(seed + a.id) - hash(seed + b.id));
}

function roundRobin(pool: Question[], count: number, seed: string, seen: Set<string>, groupOf: (q: Question) => string) {
  const groups = new Map<string, Question[]>();
  for (const q of ranked(pool, seed, seen)) { const key = groupOf(q); if (!groups.has(key)) groups.set(key, []); groups.get(key)!.push(q); }
  const lists = [...groups.values()];
  const picked: Question[] = [];
  for (let i = 0; picked.length < count && lists.some((l) => l.length); i = (i + 1) % lists.length) { const next = lists[i].shift(); if (next) picked.push(next); }
  return picked;
}

const natureOrder: Discipline[] = ["fisica", "quimica", "biologia"];

/** Seleção por tipo de sessão. Retorna o que existe no acervo publicado (sem completar com itens inexistentes). */
export function selectQuestions(kind: SessionKind, seen: Set<string>) {
  const def: KindDef = sessionKinds[kind];
  const pool = questions.filter((q) => def.bank === "all" || (q.bank ?? "base") === def.bank);
  const per = def.per;
  const seed = kind;
  const thematic = (items: Question[], modules: string[] | undefined) => {
    if (!modules) return items;
    const inside = items.filter((q) => modules.includes(q.moduleId));
    // Se o tema não tiver itens suficientes, completa com o restante do acervo (sem repetir).
    return inside.length >= per ? inside : [...inside, ...items.filter((q) => !modules.includes(q.moduleId))];
  };
  const math = thematic(pool.filter((q) => q.discipline === "matematica"), def.math);
  const nature = thematic(pool.filter((q) => q.discipline !== "matematica"), def.nature);
  const m = roundRobin(math, per, seed, seen, (q) => q.topic);
  // Natureza: alterna as três disciplinas para cobrir Física, Química e Biologia.
  const byDisc = natureOrder.map((d) => roundRobin(nature.filter((q) => q.discipline === d), per, seed + d, seen, (q) => q.topic));
  const n: Question[] = [];
  for (let i = 0; n.length < per && byDisc.some((l) => l.length); i = (i + 1) % byDisc.length) { const next = byDisc[i].shift(); if (next) n.push(next); }
  return { math: m, nature: n, ids: [...m, ...n].map((q) => q.id), shortfall: { math: Math.max(per - m.length, 0), nature: Math.max(per - n.length, 0), per } };
}

export function limitFor(kind: SessionKind, mode: SessionMode, count: number): number | null {
  if (mode === "pratica" || mode === "livre") return null;
  if (isSimulado(kind)) return Math.round((operacao.simulado.referenceMinutes / operacao.simulado.targetQuestions) * count) * 60000;
  return Math.round(count * 2.5) * 60000;
}

export function summarize(session: Session, now = Date.now()): SessionResult {
  const byDiscipline: SessionResult["byDiscipline"] = {};
  const byTopic: SessionResult["byTopic"] = {};
  let correct = 0; let answered = 0;
  for (const id of session.questionIds) {
    const q = questionById(id); if (!q) continue;
    const sel = session.answers[id];
    const d = (byDiscipline[q.discipline] ||= { total: 0, correct: 0, blank: 0 });
    const t = (byTopic[q.topic] ||= { total: 0, correct: 0 });
    d.total += 1; t.total += 1;
    if (!sel) { d.blank += 1; continue; }
    answered += 1;
    if (sel === q.answer) { correct += 1; d.correct += 1; t.correct += 1; }
  }
  const total = session.questionIds.length;
  const weakTopics = Object.entries(byTopic).filter(([, v]) => v.total >= 1 && v.correct / v.total < 0.5).sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total).map(([k]) => k).slice(0, 4);
  const start = Date.parse(session.startedAt);
  const end = session.finishedAt ? Date.parse(session.finishedAt) : now;
  return { total, answered, blank: total - answered, correct, percent: total ? Math.round((correct / total) * 100) : 0, byDiscipline, byTopic, weakTopics, elapsedMs: Math.max(end - start, 0) };
}

export const remainingMs = (session: Session, now = Date.now()) => (session.limitMs === null ? null : Math.max(session.limitMs - (now - Date.parse(session.startedAt)), 0));
