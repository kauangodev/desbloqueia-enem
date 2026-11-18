import type { Difficulty, Discipline } from "../operacao/types";

/**
 * Trilha ENEM — modelo puro (sem I/O). As unidades são derivadas do catálogo publicado da Operação (um módulo = uma unidade, com IDs
 * estáveis `u-<moduleId>`); o grafo de pré-requisitos é editorial e vive em PREREQUISITOS. Humanas, Linguagens e Redação ainda não têm
 * acervo estruturado na Operação: aparecem como cobertura em preparação, nunca como progresso simulado.
 */
export type Area = "matematica" | "natureza" | "humanas" | "linguagens" | "redacao";
export type StageKind = "fundamento" | "pratica" | "desafio" | "revisao" | "teste";
export type Mode = "aprender" | "treinar";

export const AREAS: { id: Area; label: string; disciplines: Discipline[]; hasContent: boolean; coverageNote: string }[] = [
  { id: "matematica", label: "Matemática", disciplines: ["matematica"], hasContent: true, coverageNote: "" },
  { id: "natureza", label: "Natureza", disciplines: ["fisica", "quimica", "biologia"], hasContent: true, coverageNote: "" },
  { id: "humanas", label: "Humanas", disciplines: [], hasContent: false, coverageNote: "Ainda não há unidades jogáveis de Humanas. O acervo de Humanas está nos e-books e na biblioteca; a trilha entra quando houver itens estruturados e aprovados." },
  { id: "linguagens", label: "Linguagens", disciplines: [], hasContent: false, coverageNote: "Ainda não há unidades jogáveis de Linguagens. Os e-books de Língua Portuguesa e Literatura estão disponíveis em Meus materiais." },
  { id: "redacao", label: "Redação", disciplines: [], hasContent: false, coverageNote: "A trilha de Redação (tese, estrutura e exercícios orientados) depende da reativação do módulo de redação, hoje em manutenção. O e-book de Redação continua em Meus materiais." },
];

/** Pré-requisitos entre unidades (módulo → módulos). Editorial: o catálogo só traz pré-requisitos em texto livre. */
export const PREREQUISITOS: Record<string, string[]> = {
  "mat-razao-proporcao": [],
  "mat-equacoes-sistemas": [],
  "mat-combinatoria": [],
  "mat-porcentagem": ["mat-razao-proporcao"],
  "mat-grandezas-medidas": ["mat-razao-proporcao"],
  "mat-geometria-plana": ["mat-razao-proporcao"],
  "mat-graficos-tabelas": ["mat-porcentagem"],
  "mat-estatistica": ["mat-graficos-tabelas"],
  "mat-probabilidade": ["mat-porcentagem", "mat-combinatoria"],
  "mat-geometria-espacial": ["mat-geometria-plana", "mat-grandezas-medidas"],
  "mat-funcoes": ["mat-equacoes-sistemas"],
  "mat-pa-pg": ["mat-equacoes-sistemas"],
  "fis-cinematica": [], "fis-termologia": [], "fis-ondas-optica": [], "fis-eletricidade": [],
  "fis-dinamica": ["fis-cinematica"], "fis-energia": ["fis-dinamica"],
  "qui-estequiometria": [], "qui-organica": [], "qui-eletroquimica": [],
  "qui-solucoes": ["qui-estequiometria"], "qui-termoquimica": ["qui-estequiometria"], "qui-acidos-bases-ph": ["qui-solucoes"],
  "bio-ecologia": [], "bio-citologia": [], "bio-microbiologia-saude": [],
  "bio-bioenergetica": ["bio-citologia"], "bio-genetica": ["bio-citologia"], "bio-fisiologia-humana": ["bio-citologia"],
  "bio-evolucao": ["bio-genetica"], "bio-biotecnologia": ["bio-genetica"],
};

export const PRACTICE_ITEMS = 4;
export const CHALLENGE_ITEMS = 5;
export const TEST_ITEMS = 5;
export const REVIEW_ITEMS = 3;
export const REVIEW_INTERVALS = [1, 3, 7] as const;
/** Itens mínimos no acervo da unidade para a cobertura ser "completa" (prática + desafio + teste sem repetir item). */
export const FULL_COVERAGE = PRACTICE_ITEMS + CHALLENGE_ITEMS + TEST_ITEMS;
export const MIN_POOL = PRACTICE_ITEMS + CHALLENGE_ITEMS;

/** Limiar de aprovação: 80% arredondado para cima (4 de 5). */
export const passThreshold = (total: number) => Math.max(1, Math.ceil(total * 0.8));
export const reviewThreshold = (total: number) => Math.max(1, Math.ceil(total * (2 / 3)));

export type QuestionLite = { id: string; moduleId: string; discipline: Discipline; difficulty: Difficulty };
export type ModuleLite = { id: string; discipline: Discipline; order: number; title: string; objective: string; minutes: number };

export type Unit = {
  id: string; moduleId: string; area: Area; discipline: Discipline; title: string; objective: string; minutes: number; order: number;
  prerequisites: string[]; pool: string[]; coverage: "completa" | "limitada";
};

export const unitIdOf = (moduleId: string) => `u-${moduleId}`;
export const areaOf = (discipline: Discipline): Area => (discipline === "matematica" ? "matematica" : "natureza");
const disciplineOrder: Discipline[] = ["matematica", "fisica", "quimica", "biologia"];

export function deriveUnits(modules: ModuleLite[], questions: QuestionLite[], prereq: Record<string, string[]> = PREREQUISITOS): Unit[] {
  const byModule = new Map<string, string[]>();
  for (const q of questions) (byModule.get(q.moduleId) || byModule.set(q.moduleId, []).get(q.moduleId)!).push(q.id);
  const known = new Set(modules.map((m) => m.id));
  return [...modules]
    .sort((a, b) => disciplineOrder.indexOf(a.discipline) - disciplineOrder.indexOf(b.discipline) || a.order - b.order || a.id.localeCompare(b.id))
    .filter((m) => (byModule.get(m.id)?.length ?? 0) >= MIN_POOL)
    .map((m, index) => {
      const pool = [...(byModule.get(m.id) || [])].sort();
      return {
        id: unitIdOf(m.id), moduleId: m.id, area: areaOf(m.discipline), discipline: m.discipline, title: m.title, objective: m.objective, minutes: m.minutes, order: index + 1,
        prerequisites: (prereq[m.id] || []).filter((id) => known.has(id)).map(unitIdOf),
        pool, coverage: pool.length >= FULL_COVERAGE ? "completa" : "limitada",
      } satisfies Unit;
    });
}

/** Valida o grafo: pré-requisitos existentes, sem ciclos e unidades com acervo mínimo. Devolve a lista de problemas (vazia = ok). */
export function validateGraph(units: Unit[]): string[] {
  const problems: string[] = [];
  const ids = new Set(units.map((u) => u.id));
  for (const u of units) {
    if (u.pool.length < MIN_POOL) problems.push(`${u.id}: acervo menor que ${MIN_POOL} itens`);
    for (const p of u.prerequisites) if (!ids.has(p)) problems.push(`${u.id}: pré-requisito inexistente ${p}`);
  }
  const state = new Map<string, 0 | 1 | 2>();
  const byId = new Map(units.map((u) => [u.id, u]));
  const visit = (id: string, stack: string[]) => {
    const s = state.get(id);
    if (s === 2) return;
    if (s === 1) { problems.push(`ciclo: ${[...stack, id].join(" → ")}`); return; }
    state.set(id, 1);
    for (const p of byId.get(id)?.prerequisites ?? []) visit(p, [...stack, id]);
    state.set(id, 2);
  };
  for (const u of units) visit(u.id, []);
  return problems;
}

// ───── Estado do aluno ─────
export type StageResult = { sessionId: string; at: string; correct: number; total: number; blank: number; passed: boolean };
export type Tries = { tries: StageResult[]; passedAt?: string };
export type UnitState = {
  fundamentoAt?: string;
  pratica?: StageResult;
  desafio: Tries;
  teste: Tries;
  /** `due` nulo = ciclo de revisão concluído (domínio mantido). */
  revisao?: { stage: number; due: string | null; lastAt?: string; lastSessionId?: string };
  /** Itens já usados por etapa, para priorizar itens inéditos nas próximas tentativas. */
  used: Partial<Record<StageKind, string[]>>;
};
export const emptyUnitState = (): UnitState => ({ desafio: { tries: [] }, teste: { tries: [] }, used: {} });

export type Mastery = "nova" | "em-andamento" | "concluida" | "validada";
export function masteryOf(state: UnitState | undefined): Mastery {
  if (!state) return "nova";
  if (state.teste.passedAt) return "validada";
  if (state.fundamentoAt && state.pratica && state.desafio.passedAt) return "concluida";
  if (state.fundamentoAt || state.pratica || state.desafio.tries.length || state.teste.tries.length) return "em-andamento";
  return "nova";
}
export const isDone = (m: Mastery) => m === "concluida" || m === "validada";

export type UnitStatus = { state: "bloqueada" | "disponivel" | "em-andamento" | "concluida" | "validada"; missing: Unit[]; reviewDue: boolean };

export function unitStatus(unit: Unit, units: Unit[], states: Record<string, UnitState | undefined>, today: string): UnitStatus {
  const mastery = masteryOf(states[unit.id]);
  const byId = new Map(units.map((u) => [u.id, u]));
  const missing = unit.prerequisites.filter((id) => !isDone(masteryOf(states[id]))).map((id) => byId.get(id)!).filter(Boolean);
  const review = states[unit.id]?.revisao;
  const reviewDue = isDone(mastery) && Boolean(review?.due && review.due <= today);
  if (mastery === "validada" || mastery === "concluida") return { state: mastery, missing, reviewDue };
  if (missing.length) return { state: "bloqueada", missing, reviewDue };
  return { state: mastery === "em-andamento" ? "em-andamento" : "disponivel", missing, reviewDue };
}

/** Etapa disponível? Em "aprender", segue a ordem; em "treinar", a prática e o desafio não exigem o fundamento nem o pré-requisito. */
export function stageAvailability(stage: StageKind, unit: Unit, units: Unit[], states: Record<string, UnitState | undefined>, mode: Mode, today: string): { ok: boolean; reason: string } {
  const s = states[unit.id] ?? emptyUnitState();
  const status = unitStatus(unit, units, states, today);
  const locked = status.state === "bloqueada";
  if (stage === "teste") return { ok: !isDone(masteryOf(s)), reason: isDone(masteryOf(s)) ? "Você já domina esta unidade." : "" };
  if (stage === "revisao") return status.reviewDue ? { ok: true, reason: "" } : { ok: false, reason: s.revisao?.due ? `Revisão agendada para ${s.revisao.due.split("-").reverse().join("/")}.` : "A revisão aparece depois que você conclui a unidade." };
  if (stage === "fundamento") return locked && mode === "aprender" ? { ok: false, reason: `Conclua antes: ${status.missing.map((m) => m.title).join(", ")}.` } : { ok: true, reason: "" };
  if (locked && mode === "aprender") return { ok: false, reason: `Conclua antes: ${status.missing.map((m) => m.title).join(", ")}.` };
  if (mode === "aprender" && stage === "pratica" && !s.fundamentoAt) return { ok: false, reason: "Marque o fundamento como visto antes de praticar." };
  if (mode === "aprender" && stage === "desafio" && !s.pratica) return { ok: false, reason: "Conclua a prática guiada antes do desafio." };
  return { ok: true, reason: "" };
}

const addDays = (iso: string, amount: number) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + amount); return d.toISOString().slice(0, 10); };

/** Agenda a 1ª revisão quando a unidade passa a ser dominada (uma única vez). */
export function scheduleFirstReview(state: UnitState, today: string): UnitState {
  if (state.revisao) return state;
  return { ...state, revisao: { stage: 0, due: addDays(today, REVIEW_INTERVALS[0]) } };
}

/** Resultado de uma revisão: acerto avança (1→3→7 dias; depois do último, ciclo concluído); erro volta ao início. */
export function applyReview(state: UnitState, passed: boolean, today: string): UnitState {
  const current = state.revisao ?? { stage: 0, due: today };
  if (!passed) return { ...state, revisao: { stage: 0, due: addDays(today, REVIEW_INTERVALS[0]), lastAt: today } };
  const next = current.stage + 1;
  return { ...state, revisao: next >= REVIEW_INTERVALS.length ? { stage: REVIEW_INTERVALS.length, due: null, lastAt: today } : { stage: next, due: addDays(today, REVIEW_INTERVALS[next]), lastAt: today } };
}

/** Resultado de uma etapa de verificação (desafio, teste ou revisão). Em branco vale zero. */
export function scoreStage(questionIds: string[], answers: Record<string, string>, correctOf: (id: string) => string | undefined, kind: "desafio" | "teste" | "revisao") {
  const total = questionIds.length;
  let correct = 0; let blank = 0;
  for (const id of questionIds) {
    const picked = answers[id];
    if (!picked) blank += 1;
    else if (picked === correctOf(id)) correct += 1;
  }
  const need = kind === "revisao" ? reviewThreshold(total) : passThreshold(total);
  return { total, correct, blank, need, passed: total > 0 && correct >= need };
}

// ───── Seleção de itens ─────
const hash = (text: string) => { let h = 2166136261; for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/**
 * Escolhe `count` itens do acervo da unidade, de forma determinística para a semente. Prioridade: itens que o aluno ainda não viu
 * nesta etapa (`avoid`), depois a dificuldade preferida; o desempate é um hash estável da semente. Se faltarem itens inéditos,
 * completa com os já usados (cobertura limitada) — nunca devolve menos que o possível.
 */
export function pickItems(pool: QuestionLite[], count: number, avoid: Set<string>, prefer: Difficulty[], seed: string): { ids: string[]; repeated: number } {
  const rank = (q: QuestionLite) => (prefer.includes(q.difficulty) ? 0 : 1);
  const ordered = [...pool].sort((a, b) => Number(avoid.has(a.id)) - Number(avoid.has(b.id)) || rank(a) - rank(b) || hash(`${seed}:${a.id}`) - hash(`${seed}:${b.id}`) || a.id.localeCompare(b.id));
  const picked = ordered.slice(0, count);
  return { ids: picked.map((q) => q.id), repeated: picked.filter((q) => avoid.has(q.id)).length };
}

export const STAGE_LABEL: Record<StageKind, string> = { fundamento: "Fundamento", pratica: "Prática guiada", desafio: "Desafio ENEM", revisao: "Revisão", teste: "Teste de avanço" };
export const STAGE_ITEMS: Record<Exclude<StageKind, "fundamento">, number> = { pratica: PRACTICE_ITEMS, desafio: CHALLENGE_ITEMS, teste: TEST_ITEMS, revisao: REVIEW_ITEMS };
export const STAGE_PREFER: Record<Exclude<StageKind, "fundamento">, Difficulty[]> = { pratica: ["facil", "media"], desafio: ["media", "dificil"], teste: ["media", "dificil"], revisao: ["media", "facil"] };

/** Próxima etapa sugerida para a unidade (para o botão "Continuar"). */
export function nextStage(unit: Unit, units: Unit[], states: Record<string, UnitState | undefined>, mode: Mode, today: string): StageKind | null {
  const s = states[unit.id] ?? emptyUnitState();
  const status = unitStatus(unit, units, states, today);
  if (status.reviewDue) return "revisao";
  if (isDone(masteryOf(s))) return null;
  if (!s.fundamentoAt && (mode === "aprender" || !s.pratica)) return "fundamento";
  if (!s.pratica) return "pratica";
  if (!s.desafio.passedAt) return "desafio";
  return null;
}

/** Unidade recomendada agora: revisão vencida → etapa em andamento → primeira unidade disponível, na ordem da trilha. */
export function currentUnit(units: Unit[], states: Record<string, UnitState | undefined>, mode: Mode, today: string, area?: Area): { unit: Unit; stage: StageKind; reason: "revisao" | "continuar" | "comecar" } | null {
  const scope = area ? units.filter((u) => u.area === area) : units;
  const due = scope.find((u) => unitStatus(u, units, states, today).reviewDue);
  if (due) return { unit: due, stage: "revisao", reason: "revisao" };
  const open = scope.filter((u) => { const st = unitStatus(u, units, states, today).state; return st === "em-andamento" || st === "disponivel"; });
  const started = open.find((u) => masteryOf(states[u.id]) === "em-andamento");
  const pick = started ?? open[0];
  if (!pick) return null;
  const stage = nextStage(pick, units, states, mode, today);
  return stage ? { unit: pick, stage, reason: started ? "continuar" : "comecar" } : null;
}

export function areaProgress(area: Area, units: Unit[], states: Record<string, UnitState | undefined>) {
  const list = units.filter((u) => u.area === area);
  const done = list.filter((u) => isDone(masteryOf(states[u.id]))).length;
  const validated = list.filter((u) => masteryOf(states[u.id]) === "validada").length;
  return { total: list.length, done, validated, started: list.filter((u) => masteryOf(states[u.id]) === "em-andamento").length };
}
