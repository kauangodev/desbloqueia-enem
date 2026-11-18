import assert from "node:assert/strict";
import test from "node:test";
import { modules, questions } from "../lib/operacao/catalog";
import {
  applyReview, areaProgress, currentUnit, deriveUnits, emptyUnitState, masteryOf, nextStage, passThreshold, pickItems, reviewThreshold,
  scheduleFirstReview, scoreStage, stageAvailability, unitStatus, validateGraph, type Unit, type UnitState,
} from "../lib/trilha/model";

const units = deriveUnits(modules, questions);
const find = (moduleId: string) => units.find((u) => u.moduleId === moduleId)!;
const done = (): UnitState => ({ ...emptyUnitState(), fundamentoAt: "2026-11-01T12:00:00Z", pratica: { sessionId: "s", at: "x", correct: 4, total: 4, blank: 0, passed: true }, desafio: { tries: [], passedAt: "2026-11-02T12:00:00Z" } });

test("catálogo real: 32 unidades, grafo sem ciclos nem órfãos, acervo mínimo em todas", () => {
  assert.equal(units.length, 32, "um módulo = uma unidade");
  assert.deepEqual(validateGraph(units), []);
  assert.equal(new Set(units.map((u) => u.id)).size, units.length, "IDs estáveis e únicos");
  assert.ok(units.every((u) => u.pool.length >= 9));
  assert.deepEqual([...new Set(units.map((u) => u.area))].sort(), ["matematica", "natureza"]);
  assert.equal(find("mat-razao-proporcao").id, "u-mat-razao-proporcao");
});

test("validateGraph detecta ciclo, pré-requisito inexistente e acervo curto", () => {
  const a: Unit = { ...units[0], id: "a", prerequisites: ["b"] };
  const b: Unit = { ...units[1], id: "b", prerequisites: ["a", "zzz"], pool: ["x"] };
  const problems = validateGraph([a, b]);
  assert.ok(problems.some((p) => p.startsWith("ciclo")));
  assert.ok(problems.some((p) => p.includes("inexistente")));
  assert.ok(problems.some((p) => p.includes("acervo menor")));
});

test("desbloqueio: pré-requisito concluído abre a próxima; bloqueio informa o motivo", () => {
  const razao = find("mat-razao-proporcao"); const pct = find("mat-porcentagem");
  const none: Record<string, UnitState> = {};
  assert.equal(unitStatus(razao, units, none, "2026-11-18").state, "disponivel");
  const locked = unitStatus(pct, units, none, "2026-11-18");
  assert.equal(locked.state, "bloqueada");
  assert.deepEqual(locked.missing.map((u) => u.id), [razao.id]);
  assert.equal(unitStatus(pct, units, { [razao.id]: done() }, "2026-11-18").state, "disponivel");
  assert.equal(stageAvailability("pratica", pct, units, none, "aprender", "2026-11-18").ok, false);
  assert.match(stageAvailability("fundamento", pct, units, none, "aprender", "2026-11-18").reason, /Conclua antes/);
});

test("modo treinar não exige fundamento nem pré-requisito para prática e desafio; teste de avanço sempre disponível até dominar", () => {
  const pct = find("mat-porcentagem");
  assert.equal(stageAvailability("pratica", pct, units, {}, "treinar", "2026-11-18").ok, true);
  assert.equal(stageAvailability("desafio", pct, units, {}, "treinar", "2026-11-18").ok, true);
  assert.equal(stageAvailability("desafio", pct, units, {}, "aprender", "2026-11-18").ok, false);
  assert.equal(stageAvailability("teste", pct, units, {}, "aprender", "2026-11-18").ok, true);
  const mastered: UnitState = { ...emptyUnitState(), teste: { tries: [], passedAt: "2026-11-10T12:00:00Z" } };
  assert.equal(stageAvailability("teste", pct, units, { [pct.id]: mastered }, "aprender", "2026-11-18").ok, false);
});

test("teste de avanço valida só a própria unidade: não libera pré-requisitos não verificados", () => {
  const razao = find("mat-razao-proporcao"); const pct = find("mat-porcentagem"); const graf = find("mat-graficos-tabelas");
  const states = { [pct.id]: { ...emptyUnitState(), teste: { tries: [], passedAt: "2026-11-10T12:00:00Z" } } as UnitState };
  assert.equal(masteryOf(states[pct.id]), "validada");
  assert.equal(unitStatus(razao, units, states, "2026-11-18").state, "disponivel", "Razão continua por fazer");
  assert.equal(unitStatus(graf, units, states, "2026-11-18").state, "disponivel", "Gráficos abre porque Porcentagem foi validada");
});

test("domínio: concluída exige fundamento + prática + desafio aprovado; validada vem do teste", () => {
  assert.equal(masteryOf(undefined), "nova");
  assert.equal(masteryOf({ ...emptyUnitState(), fundamentoAt: "x" }), "em-andamento");
  assert.equal(masteryOf(done()), "concluida");
  assert.equal(masteryOf({ ...done(), desafio: { tries: [] } }), "em-andamento");
});

test("limiar: 80% arredondado para cima; branco vale zero; resposta certa na posição certa", () => {
  assert.equal(passThreshold(5), 4);
  assert.equal(passThreshold(4), 4);
  assert.equal(passThreshold(10), 8);
  assert.equal(passThreshold(3), 3);
  assert.equal(reviewThreshold(3), 2);
  const key: Record<string, string> = { a: "A", b: "B", c: "C", d: "D", e: "E" };
  const ok = scoreStage(["a", "b", "c", "d", "e"], { a: "A", b: "B", c: "C", d: "D", e: "A" }, (id) => key[id], "desafio");
  assert.deepEqual({ c: ok.correct, b: ok.blank, p: ok.passed }, { c: 4, b: 0, p: true });
  const withBlank = scoreStage(["a", "b", "c", "d", "e"], { a: "A", b: "B", c: "C", d: "D" }, (id) => key[id], "desafio");
  assert.deepEqual({ c: withBlank.correct, b: withBlank.blank, p: withBlank.passed }, { c: 4, b: 1, p: true });
  const fail = scoreStage(["a", "b", "c", "d", "e"], { a: "A", b: "B", c: "C" }, (id) => key[id], "teste");
  assert.equal(fail.passed, false);
  assert.equal(fail.blank, 2);
  assert.equal(scoreStage([], {}, () => undefined, "desafio").passed, false);
});

test("revisão espaçada: 1→3→7 dias; erro volta ao início; ao fim, ciclo concluído", () => {
  const first = scheduleFirstReview(done(), "2026-11-18");
  assert.deepEqual(first.revisao, { stage: 0, due: "2026-11-19" });
  assert.equal(scheduleFirstReview(first, "2026-12-30").revisao?.due, "2026-11-19", "agendar de novo não muda a data");
  const r1 = applyReview(first, true, "2026-11-19");
  assert.equal(r1.revisao?.due, "2026-11-22");
  const r2 = applyReview(r1, true, "2026-11-22");
  assert.equal(r2.revisao?.due, "2026-11-29");
  const r3 = applyReview(r2, true, "2026-11-29");
  assert.equal(r3.revisao?.due, null);
  const lapse = applyReview(r2, false, "2026-11-29");
  assert.deepEqual({ s: lapse.revisao?.stage, d: lapse.revisao?.due }, { s: 0, d: "2026-11-30" });
  const razao = find("mat-razao-proporcao");
  assert.equal(unitStatus(razao, units, { [razao.id]: first }, "2026-11-19").reviewDue, true);
  assert.equal(unitStatus(razao, units, { [razao.id]: first }, "2026-11-18").reviewDue, false);
});

test("seleção de itens é determinística, prioriza inéditos e completa com repetidos quando falta acervo", () => {
  const razao = find("mat-razao-proporcao");
  const pool = questions.filter((q) => q.moduleId === razao.moduleId).map((q) => ({ id: q.id, moduleId: q.moduleId, discipline: q.discipline, difficulty: q.difficulty }));
  const a = pickItems(pool, 5, new Set(), ["media", "dificil"], "u:desafio:1");
  assert.deepEqual(a.ids, pickItems(pool, 5, new Set(), ["media", "dificil"], "u:desafio:1").ids, "mesma semente, mesmo resultado");
  assert.notDeepEqual(a.ids, pickItems(pool, 5, new Set(), ["media", "dificil"], "u:desafio:2").ids, "outra tentativa, outra seleção");
  assert.equal(new Set(a.ids).size, 5);
  const b = pickItems(pool, 5, new Set(a.ids), ["media", "dificil"], "u:desafio:2");
  assert.ok(b.ids.every((id) => !a.ids.includes(id)), "evita o que já foi usado");
  assert.equal(b.repeated, 0);
  const small = pickItems(pool.slice(0, 5), 5, new Set(pool.slice(0, 5).map((q) => q.id)), ["media"], "s");
  assert.equal(small.ids.length, 5);
  assert.equal(small.repeated, 5, "sem inéditos: repete e informa");
  assert.equal(pickItems(pool.slice(0, 2), 5, new Set(), ["media"], "s").ids.length, 2, "nunca inventa itens");
});

test("recomendação: aluno novo começa pela 1ª unidade (fundamento); revisão vencida tem prioridade; continuar vence começar", () => {
  const razao = find("mat-razao-proporcao");
  const start = currentUnit(units, {}, "aprender", "2026-11-18", "matematica");
  assert.equal(start?.unit.id, razao.id);
  assert.equal(start?.stage, "fundamento");
  assert.equal(start?.reason, "comecar");
  const inProgress = { [razao.id]: { ...emptyUnitState(), fundamentoAt: "x" } as UnitState };
  const cont = currentUnit(units, inProgress, "aprender", "2026-11-18", "matematica");
  assert.deepEqual({ s: cont?.stage, r: cont?.reason }, { s: "pratica", r: "continuar" });
  const dueState = { [razao.id]: scheduleFirstReview(done(), "2026-11-10") };
  const due = currentUnit(units, dueState, "aprender", "2026-11-18", "matematica");
  assert.deepEqual({ s: due?.stage, r: due?.reason, u: due?.unit.id }, { s: "revisao", r: "revisao", u: razao.id });
  assert.equal(nextStage(razao, units, { [razao.id]: done() }, "aprender", "2026-11-18"), null);
});

test("progresso por área conta unidades concluídas e validadas", () => {
  const razao = find("mat-razao-proporcao"); const pct = find("mat-porcentagem");
  const p = areaProgress("matematica", units, { [razao.id]: done(), [pct.id]: { ...emptyUnitState(), teste: { tries: [], passedAt: "x" } } });
  assert.deepEqual({ done: p.done, validated: p.validated, total: p.total }, { done: 2, validated: 1, total: 12 });
  assert.equal(areaProgress("natureza", units, {}).total, 20);
  assert.equal(areaProgress("humanas", units, {}).total, 0);
});
