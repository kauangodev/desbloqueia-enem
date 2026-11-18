import type { Difficulty, Discipline, Origin } from "./types";

/**
 * Filtros do banco de questões e do caderno de erros, serializados na URL para recarregar e compartilhar a mesma seleção.
 * Valores inválidos viram o padrão (nunca quebram a página). A posição na lista (`n`, base 1) também vai na URL.
 */
export type Duration = "" | "curta" | "media" | "longa";
export type Status = "todas" | "nao" | "erradas" | "acertadas" | "favoritas" | "depois";

export type Filters = {
  discipline: "" | Discipline;
  topic: string;
  origin: "" | Origin;
  difficulty: "" | Difficulty;
  year: string;
  search: string;
  duration: Duration;
  status: Status;
  moduleId: string;
  position: number;
};

export const emptyFilters: Filters = { discipline: "", topic: "", origin: "", difficulty: "", year: "", search: "", duration: "", status: "todas", moduleId: "", position: 1 };

const disciplines: Discipline[] = ["matematica", "fisica", "quimica", "biologia"];
const origins: Origin[] = ["oficial", "autoral", "adaptada"];
const difficulties: Difficulty[] = ["facil", "media", "dificil"];
const durations: Duration[] = ["curta", "media", "longa"];
const statuses: Status[] = ["nao", "erradas", "acertadas", "favoritas", "depois"];

type Source = { get(key: string): string | null };
const pick = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback);
const text = (value: string | null, max: number) => (value ?? "").trim().slice(0, max);

export function parseFilters(source: Source, known?: { topics?: string[]; modules?: string[] }): Filters {
  const topic = text(source.get("t"), 80);
  const moduleId = text(source.get("m"), 64);
  const year = text(source.get("y"), 4);
  const position = Math.floor(Number(source.get("n")));
  return {
    discipline: pick(source.get("d"), disciplines, "" as "" | Discipline),
    topic: !known?.topics || known.topics.includes(topic) ? topic : "",
    origin: pick(source.get("o"), origins, "" as "" | Origin),
    difficulty: pick(source.get("df"), difficulties, "" as "" | Difficulty),
    year: /^\d{4}$/.test(year) ? year : "",
    search: text(source.get("q"), 60),
    duration: pick(source.get("dur"), durations, "" as Duration),
    status: pick(source.get("s"), statuses, "todas" as Status),
    moduleId: !known?.modules || known.modules.includes(moduleId) ? moduleId : "",
    position: Number.isFinite(position) && position >= 1 ? Math.min(position, 100000) : 1,
  };
}

export function serializeFilters(filters: Filters): string {
  const params = new URLSearchParams();
  const set = (key: string, value: string) => { if (value) params.set(key, value); };
  set("d", filters.discipline); set("t", filters.topic); set("o", filters.origin); set("df", filters.difficulty);
  set("y", filters.year); set("q", filters.search); set("dur", filters.duration); set("m", filters.moduleId);
  if (filters.status !== "todas") params.set("s", filters.status);
  if (filters.position > 1) params.set("n", String(filters.position));
  return params.toString();
}

export type FilterableMeta = { id: string; discipline: Discipline; topic: string; moduleId: string; origin: Origin; difficulty: Difficulty; minutes: number; year?: number };
export type FilterState = {
  attempts: Record<string, { last: boolean | null; everWrong: boolean } | undefined>;
  fav: string[];
  later: string[];
};

/** Aplica os filtros à lista de metadados. `view: "erros"` restringe ao caderno (errou alguma vez ou marcou para revisar). */
export function applyFilters(questions: FilterableMeta[], filters: Filters, state: FilterState, view: "questoes" | "erros", moduleTitles: Record<string, string> = {}) {
  const term = filters.search.trim().toLowerCase();
  return questions.filter((q) => {
    const a = state.attempts[q.id];
    if (view === "erros" && !(a?.everWrong || state.later.includes(q.id))) return false;
    if (filters.discipline && q.discipline !== filters.discipline) return false;
    if (filters.topic && q.topic !== filters.topic) return false;
    if (filters.origin && q.origin !== filters.origin) return false;
    if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
    if (filters.year && String(q.year ?? "") !== filters.year) return false;
    if (filters.moduleId && q.moduleId !== filters.moduleId) return false;
    if (filters.duration === "curta" && q.minutes > 2) return false;
    if (filters.duration === "media" && q.minutes !== 3) return false;
    if (filters.duration === "longa" && q.minutes < 4) return false;
    if (term && !`${q.topic} ${moduleTitles[q.moduleId] || ""} ${q.id}`.toLowerCase().includes(term)) return false;
    switch (filters.status) {
      case "nao": return !a;
      case "erradas": return a?.last === false;
      case "acertadas": return a?.last === true;
      case "favoritas": return state.fav.includes(q.id);
      case "depois": return state.later.includes(q.id);
      default: return true;
    }
  });
}
