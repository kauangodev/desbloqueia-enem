import type { Discipline, QuestionMeta } from "../operacao/types";

/**
 * Tópicos recorrentes: contagem das questões OFICIAIS do acervo por tópico e ano.
 * É uma amostra do que está no acervo (não a prova inteira): quem exibe deve dizer quantas provas/questões a compõem.
 * Não há previsão de prova: só "apareceu em N edições do acervo".
 */
export type Recorrente = {
  discipline: Discipline;
  topic: string;
  moduleId: string;
  official: number;
  years: number[];
  /** Questões autorais do mesmo tópico, para treinar além das oficiais. */
  authorial: number;
};

export type RecorrentesResumo = { rows: Recorrente[]; officialTotal: number; years: number[] };

export function recorrentes(metas: QuestionMeta[]): RecorrentesResumo {
  const map = new Map<string, Recorrente>();
  for (const meta of metas) {
    const key = `${meta.discipline}|${meta.topic}`;
    const row = map.get(key) ?? { discipline: meta.discipline, topic: meta.topic, moduleId: meta.moduleId, official: 0, years: [], authorial: 0 };
    if (meta.origin === "oficial") {
      row.official += 1;
      if (meta.year && !row.years.includes(meta.year)) row.years.push(meta.year);
    } else row.authorial += 1;
    map.set(key, row);
  }
  const rows = [...map.values()].filter((row) => row.official > 0);
  for (const row of rows) row.years.sort((a, b) => a - b);
  rows.sort((a, b) => b.years.length - a.years.length || b.official - a.official || a.topic.localeCompare(b.topic, "pt-BR"));
  const years = [...new Set(rows.flatMap((row) => row.years))].sort((a, b) => a - b);
  return { rows, officialTotal: rows.reduce((sum, row) => sum + row.official, 0), years };
}
