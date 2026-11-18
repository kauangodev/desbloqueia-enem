import { grade, modules, questionById, questions, toPublic } from "../operacao/catalog";
import { recordAttempt } from "../operacao/attempts";
import type { Kv, OperacaoUser } from "../operacao/store";
import type { Correction, PublicQuestion } from "../operacao/types";
import type { TodayTrilha } from "../aluno/today";
import {
  applyReview, currentUnit, deriveUnits, emptyUnitState, isDone, masteryOf, pickItems, scheduleFirstReview, scoreStage, stageAvailability,
  STAGE_ITEMS, STAGE_LABEL, STAGE_PREFER, unitStatus, type Mode, type StageKind, type StageResult, type Unit, type UnitState,
} from "./model";

/**
 * Trilha ENEM — serviço de persistência sobre o armazenamento por aluno (`operacao_state`, via `Kv`). Nada aqui confia no cliente:
 * o servidor valida unidade, etapa, pré-requisito, itens e gabarito. Os efeitos são idempotentes por ID de sessão e por item
 * (reenvio por timeout devolve o estado já gravado, sem duplicar tentativa nem resultado). O armazenamento chave-valor não tem
 * transação: duas requisições simultâneas ao MESMO item podem, na pior hipótese, gravar a tentativa duas vezes no histórico (o XP não
 * muda: vale só a 1ª tentativa por questão).
 */
export class TrilhaError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message); }
}

export const UNITS: Unit[] = deriveUnits(modules, questions);
const unitIndex = new Map(UNITS.map((u) => [u.id, u]));
export const unitById = (id: string) => unitIndex.get(id);
const liteQuestions = new Map(questions.map((q) => [q.id, { id: q.id, moduleId: q.moduleId, discipline: q.discipline, difficulty: q.difficulty }]));

export type Prefs = { serie: "" | "1" | "2" | "3" | "concluido"; modo: Mode };
export const defaultPrefs: Prefs = { serie: "", modo: "aprender" };

export type StageSession = {
  id: string; unitId: string; stage: Exclude<StageKind, "fundamento">; questionIds: string[]; answers: Record<string, string>;
  recorded: Record<string, true>; cursor: number; startedAt: string; finishedAt?: string; result?: StageResult; repeated: number;
};

const KV_UNIT = "trilha-u";
const KV_SESSION = "trilha-s";
const KV_PREF = "trilha-pref";
const stateRef = (unitId: string) => unitId;
const sessionRef = (unitId: string, stage: string) => `${unitId}:${stage}`;

async function readStates(kv: Kv) {
  const rows = await kv.list<UnitState>(KV_UNIT);
  return Object.fromEntries(rows.map((row) => [row.ref, { ...emptyUnitState(), ...row.data }])) as Record<string, UnitState>;
}
export async function readPrefs(kv: Kv): Promise<Prefs> {
  const saved = await kv.get<Partial<Prefs>>(KV_PREF, "config");
  return { serie: (["1", "2", "3", "concluido"] as const).find((v) => v === saved?.serie) ?? "", modo: saved?.modo === "treinar" ? "treinar" : "aprender" };
}

export async function loadOverview(kv: Kv) {
  const [states, prefs] = await Promise.all([readStates(kv), readPrefs(kv)]);
  return { units: UNITS, states, prefs };
}

export async function setPrefs(kv: Kv, input: { serie?: string; modo?: string }) {
  const current = await readPrefs(kv);
  const next: Prefs = {
    serie: input.serie === undefined ? current.serie : ((["", "1", "2", "3", "concluido"] as const).find((v) => v === input.serie) ?? current.serie),
    modo: input.modo === "treinar" || input.modo === "aprender" ? input.modo : current.modo,
  };
  await kv.set(KV_PREF, "config", next);
  return next;
}

function requireUnit(unitId: string) {
  const unit = unitById(unitId);
  if (!unit) throw new TrilhaError("unidade_inexistente", "Unidade não encontrada.", 404);
  return unit;
}

export async function markFundamento(kv: Kv, unitId: string, today: string, now: Date = new Date()) {
  const unit = requireUnit(unitId);
  const [states, prefs] = await Promise.all([readStates(kv), readPrefs(kv)]);
  const availability = stageAvailability("fundamento", unit, UNITS, states, prefs.modo, today);
  if (!availability.ok) throw new TrilhaError("bloqueada", availability.reason, 409);
  const state = states[unitId] ?? emptyUnitState();
  if (!state.fundamentoAt) {
    const next = { ...state, fundamentoAt: now.toISOString() };
    await kv.set(KV_UNIT, stateRef(unitId), next);
    // Mesmo evento do módulo na Operação: o progresso de leitura e as missões enxergam o fundamento concluído.
    await kv.set("read", unit.moduleId, { concluded: true, at: now.toISOString() });
    return next;
  }
  return state;
}

function publicQuestions(ids: string[]): PublicQuestion[] {
  return ids.map((id) => questionById(id)).filter((q): q is NonNullable<typeof q> => Boolean(q)).map(toPublic);
}

/** Payload da sessão para o cliente. Gabarito só aparece na prática guiada, e apenas dos itens já respondidos. */
function sessionPayload(session: StageSession) {
  const corrections: Record<string, Correction> = {};
  if (session.stage === "pratica") for (const id of session.questionIds) if (session.answers[id]) { const q = questionById(id); if (q) corrections[id] = grade(q, session.answers[id]); }
  return {
    session: { id: session.id, unitId: session.unitId, stage: session.stage, total: session.questionIds.length, cursor: session.cursor, answers: session.answers, finished: Boolean(session.finishedAt), startedAt: session.startedAt, repeated: session.repeated, result: session.result ?? null },
    questions: publicQuestions(session.questionIds),
    corrections,
  };
}

export async function startStage(kv: Kv, unitId: string, stage: string, today: string, now: Date = new Date()) {
  const unit = requireUnit(unitId);
  if (stage !== "pratica" && stage !== "desafio" && stage !== "teste" && stage !== "revisao") throw new TrilhaError("etapa_invalida", "Etapa inválida.", 400);
  const [states, prefs] = await Promise.all([readStates(kv), readPrefs(kv)]);
  const availability = stageAvailability(stage, unit, UNITS, states, prefs.modo, today);
  if (!availability.ok) throw new TrilhaError("indisponivel", availability.reason || "Etapa indisponível.", 409);
  const existing = await kv.get<StageSession>(KV_SESSION, sessionRef(unitId, stage));
  if (existing && !existing.finishedAt) return sessionPayload(existing);

  const state = states[unitId] ?? emptyUnitState();
  const used = new Set<string>(state.used[stage] ?? []);
  const avoid = new Set(used);
  if (stage === "desafio" || stage === "teste") for (const id of state.used.pratica ?? []) avoid.add(id);
  const pool = unit.pool.map((id) => liteQuestions.get(id)!).filter(Boolean);
  const salt = (state.used[stage] ?? []).length;
  const picked = pickItems(pool, STAGE_ITEMS[stage], avoid, STAGE_PREFER[stage], `${unitId}:${stage}:${salt}`);
  if (!picked.ids.length) throw new TrilhaError("sem_acervo", "Ainda não há questões publicadas suficientes para esta etapa.", 409);
  const session: StageSession = { id: `${unitId}:${stage}:${now.getTime()}`, unitId, stage, questionIds: picked.ids, answers: {}, recorded: {}, cursor: 0, startedAt: now.toISOString(), repeated: picked.repeated };
  await kv.set(KV_SESSION, sessionRef(unitId, stage), session);
  await kv.set(KV_UNIT, stateRef(unitId), { ...state, used: { ...state.used, [stage]: [...new Set([...(state.used[stage] ?? []), ...picked.ids])] } });
  return sessionPayload(session);
}

async function loadSession(kv: Kv, unitId: string, stage: string, sessionId: string) {
  const session = await kv.get<StageSession>(KV_SESSION, sessionRef(unitId, stage));
  if (!session || session.id !== sessionId) throw new TrilhaError("sessao_inexistente", "Sessão não encontrada. Abra a etapa de novo.", 404);
  return session;
}

export async function answerItem(kv: Kv, input: { unitId: string; stage: string; sessionId: string; questionId: string; selected: string }, now: Date = new Date()) {
  const session = await loadSession(kv, input.unitId, input.stage, input.sessionId);
  if (session.finishedAt) throw new TrilhaError("finalizada", "Esta etapa já foi entregue.", 409);
  if (!session.questionIds.includes(input.questionId)) throw new TrilhaError("item_invalido", "Questão fora desta etapa.", 400);
  const q = questionById(input.questionId);
  if (!q) throw new TrilhaError("item_inexistente", "Questão não encontrada.", 404);
  const duplicate = Boolean(session.answers[input.questionId]);
  if (!duplicate) {
    session.answers[input.questionId] = input.selected;
    session.cursor = Math.min(session.questionIds.indexOf(input.questionId) + 1, session.questionIds.length - 1);
    await kv.set(KV_SESSION, sessionRef(input.unitId, input.stage), session); // a resposta fica gravada antes de qualquer efeito
  }
  if (session.stage === "pratica") {
    const picked = session.answers[input.questionId];
    const correction = grade(q, picked);
    if (!session.recorded[input.questionId]) {
      await recordAttempt(kv, q.id, picked, correction.correct, "trilha-pratica", now);
      session.recorded[input.questionId] = true;
      await kv.set(KV_SESSION, sessionRef(input.unitId, input.stage), session);
    }
    return { saved: true, duplicate, selected: picked, correction };
  }
  return { saved: true, duplicate, selected: session.answers[input.questionId] };
}

export async function setCursor(kv: Kv, input: { unitId: string; stage: string; sessionId: string; cursor: number }) {
  const session = await loadSession(kv, input.unitId, input.stage, input.sessionId);
  if (session.finishedAt) return { cursor: session.cursor };
  session.cursor = Math.max(0, Math.min(Math.floor(input.cursor), session.questionIds.length - 1));
  await kv.set(KV_SESSION, sessionRef(input.unitId, input.stage), session);
  return { cursor: session.cursor };
}

export async function finishStage(kv: Kv, input: { unitId: string; stage: string; sessionId: string }, today: string, now: Date = new Date()) {
  const unit = requireUnit(input.unitId);
  const session = await loadSession(kv, input.unitId, input.stage, input.sessionId);
  const corrections = () => session.questionIds.map((id) => questionById(id)).filter((q): q is NonNullable<typeof q> => Boolean(q)).map((q) => grade(q, session.answers[q.id] ?? null));

  if (session.finishedAt && session.result) {
    return { result: session.result, corrections: session.stage === "pratica" ? [] : corrections(), unitId: unit.id, mastery: masteryOf((await readStates(kv))[unit.id]), alreadyFinished: true };
  }
  const answered = session.questionIds.filter((id) => session.answers[id]).length;
  if (session.stage === "pratica" && answered < session.questionIds.length) throw new TrilhaError("incompleta", "Responda todas as questões da prática guiada para concluir.", 409);

  const key = (id: string) => questionById(id)?.answer;
  let result: StageResult;
  if (session.stage === "pratica") {
    const correct = session.questionIds.filter((id) => session.answers[id] === key(id)).length;
    result = { sessionId: session.id, at: now.toISOString(), correct, total: session.questionIds.length, blank: 0, passed: true };
  } else {
    const score = scoreStage(session.questionIds, session.answers, key, session.stage);
    result = { sessionId: session.id, at: now.toISOString(), correct: score.correct, total: score.total, blank: score.blank, passed: score.passed };
    // Tentativas das etapas de verificação entram no histórico compartilhado (Banco, Caderno e Dashboard), uma vez por item.
    for (const id of session.questionIds) {
      const picked = session.answers[id];
      if (picked && !session.recorded[id]) { await recordAttempt(kv, id, picked, picked === key(id), `trilha-${session.stage}`, now); session.recorded[id] = true; }
    }
    await kv.set(KV_SESSION, sessionRef(input.unitId, input.stage), session);
  }

  const states = await readStates(kv);
  let state = states[unit.id] ?? emptyUnitState();
  if (session.stage === "pratica") state = { ...state, pratica: state.pratica?.sessionId === result.sessionId ? state.pratica : result };
  else if (session.stage === "desafio" || session.stage === "teste") {
    const bucket = state[session.stage];
    const tries = bucket.tries.some((t) => t.sessionId === result.sessionId) ? bucket.tries : [...bucket.tries, result];
    state = { ...state, [session.stage]: { tries, passedAt: bucket.passedAt ?? (result.passed ? now.toISOString() : undefined) } };
  } else if (session.stage === "revisao" && state.revisao?.lastSessionId !== result.sessionId) {
    state = applyReview(state, result.passed, today);
    state = { ...state, revisao: { ...state.revisao!, lastSessionId: result.sessionId } };
  }
  if (isDone(masteryOf(state))) state = scheduleFirstReview(state, today);
  await kv.set(KV_UNIT, stateRef(unit.id), state);

  session.finishedAt = now.toISOString();
  session.result = result;
  await kv.set(KV_SESSION, sessionRef(input.unitId, input.stage), session);
  return { result, corrections: session.stage === "pratica" ? [] : corrections(), unitId: unit.id, mastery: masteryOf(state), alreadyFinished: false };
}

/** Visão da unidade para as páginas: estado, situação e disponibilidade de cada etapa (com o motivo quando bloqueada). */
export async function unitView(kv: Kv, unitId: string, today: string) {
  const unit = requireUnit(unitId);
  const { states, prefs } = await loadOverview(kv);
  const status = unitStatus(unit, UNITS, states, today);
  const stages = (["fundamento", "pratica", "desafio", "teste", "revisao"] as StageKind[]).map((stage) => ({ stage, label: STAGE_LABEL[stage], items: stage === "fundamento" ? null : STAGE_ITEMS[stage], ...stageAvailability(stage, unit, UNITS, states, prefs.modo, today) }));
  const active: Partial<Record<StageKind, { answered: number; total: number }>> = {};
  for (const stage of ["pratica", "desafio", "teste", "revisao"] as const) {
    const s = await kv.get<StageSession>(KV_SESSION, sessionRef(unitId, stage));
    if (s && !s.finishedAt) active[stage] = { answered: Object.keys(s.answers).length, total: s.questionIds.length };
  }
  return { unit, state: states[unitId] ?? emptyUnitState(), mastery: masteryOf(states[unitId]), status, prefs, stages, active, states };
}

/** Sugestão da Trilha para o "Seu próximo passo" do Início. */
export async function trilhaForToday(user: Pick<OperacaoUser, "kv">, today: string): Promise<TodayTrilha | null> {
  const { states, prefs } = await loadOverview(user.kv);
  const rec = currentUnit(UNITS, states, prefs.modo, today);
  if (!rec) return null;
  const started = rec.reason !== "comecar" || Object.values(states).some((s) => masteryOf(s) !== "nova");
  const perQuestion = (() => { const ms = rec.unit.pool.map((id) => questionById(id)?.minutes ?? 2); return ms.reduce((a, b) => a + b, 0) / Math.max(ms.length, 1); })();
  const minutes = rec.stage === "fundamento" ? rec.unit.minutes : Math.max(1, Math.round((STAGE_ITEMS[rec.stage] ?? 5) * perQuestion));
  const href = rec.stage === "fundamento" ? `/aluno/trilha/${rec.unit.id}` : `/aluno/trilha/${rec.unit.id}/${rec.stage}`;
  const reason = rec.reason === "revisao" ? "Revisão agendada: revisar na data certa é o que faz o conteúdo ficar." : rec.reason === "continuar" ? `Próxima etapa: ${STAGE_LABEL[rec.stage]}.` : `Primeira etapa: ${STAGE_LABEL[rec.stage]}. Abre as próximas unidades quando você concluir.`;
  return { unitId: rec.unit.id, title: rec.unit.title, stageLabel: STAGE_LABEL[rec.stage], reason, href, minutes, started };
}
