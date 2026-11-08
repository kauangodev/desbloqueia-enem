import type { Bank, Difficulty, Discipline, Question } from "../../lib/operacao/types";

type Letter = "A" | "B" | "C" | "D" | "E";
const L: Letter[] = ["A", "B", "C", "D", "E"];
const reviewedAt = "2026-11-08";

const hash = (text: string) => { let h = 2166136261; for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/**
 * Distribui a posição do gabarito de forma determinística (por id), para que as letras corretas fiquem equilibradas.
 * As demais alternativas mantêm a ordem relativa; as explicações dos distratores acompanham o novo lugar.
 * NÃO se aplica a questões oficiais, cuja ordem de alternativas é a da prova.
 */
export function placeAnswer(id: string, options: string[], answer: Letter, distractors: Partial<Record<Letter, string>>) {
  const correctIdx = L.indexOf(answer);
  const target = hash(`pos:${id}`) % 5;
  const others = options.map((text, i) => ({ text, from: L[i] })).filter((_, i) => i !== correctIdx);
  const ordered: { text: string; from: Letter }[] = [];
  let k = 0;
  for (let i = 0; i < 5; i += 1) ordered.push(i === target ? { text: options[correctIdx], from: answer } : others[k++]);
  const map = new Map(ordered.map((o, i) => [o.from, L[i]]));
  const remapped: Partial<Record<Letter, string>> = {};
  for (const [key, value] of Object.entries(distractors)) { const to = map.get(key as Letter); if (to && value) remapped[to] = value; }
  return { options: ordered.map((o, i) => ({ id: L[i], text: o.text })), answer: L[target], distractors: remapped };
}

/**
 * Construtor compacto de questões AUTORAIS (estilo Enem). Cada item foi resolvido e conferido por conta própria.
 * Formato: Q(id, disciplina, tópico, módulo, dificuldade, minutos, enunciado, [A..E], gabarito, resolução, {explicações dos distratores}, erro comum)
 */
export const Q = (
  id: string, d: Discipline, topic: string, moduleId: string, diff: Difficulty, minutes: number,
  statement: string, options: [string, string, string, string, string], answer: Letter,
  resolution: string, distractors: Partial<Record<Letter, string>>, misconception: string,
): Question => {
  const placed = placeAnswer(id, options, answer, distractors);
  return {
    id, discipline: d, topic, moduleId, origin: "autoral", statement,
    options: placed.options, answer: placed.answer, resolution, distractors: placed.distractors, misconception, minutes, difficulty: diff, status: "publicado", reviewedAt,
    source: { label: "Autoria GoDev Education", reuse: "Conteúdo autoral." },
  };
};

/** Construtor para um conjunto específico (simulados novos s1–s4). */
export const makeQ = (bank: Bank) => (...args: Parameters<typeof Q>): Question => ({ ...Q(...args), bank });
