import assert from "node:assert/strict";
import test from "node:test";
import { questionById } from "../lib/operacao/catalog";
import { memoryKv } from "../lib/operacao/memory-kv";
import { answerItem, finishStage, loadOverview, markFundamento, setCursor, setPrefs, startStage, TrilhaError, trilhaForToday, unitView } from "../lib/trilha/service";
import { masteryOf } from "../lib/trilha/model";
import type { Attempt } from "../lib/operacao/engine";

const U1 = "u-mat-razao-proporcao";
const U2 = "u-mat-porcentagem";
const today = "2026-11-18";
let counter = 0;
const fresh = () => memoryKv(`trilha-test-${(counter += 1)}-${Math.random().toString(36).slice(2, 8)}`);
const t = (n: number) => new Date(Date.UTC(2026, 10, 18, 12, 0, n));

type Started = Awaited<ReturnType<typeof startStage>>;
const right = (id: string) => questionById(id)!.answer;
const wrong = (id: string) => (["A", "B", "C", "D", "E"].find((x) => x !== right(id)))!;
async function play(kv: ReturnType<typeof fresh>, started: Started, mode: "all-right" | { wrongCount: number }, stage: string, startAt = 10) {
  const ids = started.questions.map((q) => q.id);
  const wrongCount = mode === "all-right" ? 0 : mode.wrongCount;
  let n = startAt;
  for (const [i, id] of ids.entries()) await answerItem(kv, { unitId: U1, stage, sessionId: started.session.id, questionId: id, selected: i < wrongCount ? wrong(id) : right(id) }, t(n++));
  return ids;
}
const attemptsOf = async (kv: ReturnType<typeof fresh>, id: string) => (await kv.get<Attempt>("attempt", id))?.history.length ?? 0;

test("ciclo completo: fundamento → prática → desafio reprovado → novo desafio aprovado → unidade concluída, revisão agendada e próxima unidade aberta", async () => {
  const kv = fresh();
  await markFundamento(kv, U1, today, t(1));
  assert.ok(await kv.get("read", "mat-razao-proporcao"), "fundamento usa o mesmo evento de leitura do módulo");

  const pr = await startStage(kv, U1, "pratica", today, t(2));
  assert.equal(pr.questions.length, 4);
  const prIds = await play(kv, pr, { wrongCount: 1 }, "pratica");
  for (const id of prIds) assert.equal(await attemptsOf(kv, id), 1, "prática grava a tentativa no histórico compartilhado");
  const prDone = await finishStage(kv, { unitId: U1, stage: "pratica", sessionId: pr.session.id }, today, t(30));
  assert.equal(prDone.result.passed, true);
  assert.equal(prDone.result.correct, 3);

  const d1 = await startStage(kv, U1, "desafio", today, t(40));
  assert.equal(d1.questions.length, 5);
  assert.ok(d1.questions.every((q) => !prIds.includes(q.id)), "desafio prioriza itens que a prática não usou");
  await play(kv, d1, { wrongCount: 3 }, "desafio", 41);
  const d1Done = await finishStage(kv, { unitId: U1, stage: "desafio", sessionId: d1.session.id }, today, t(60));
  assert.equal(d1Done.result.passed, false);
  assert.equal(d1Done.result.correct, 2);
  assert.equal(d1Done.corrections.length, 5, "correção só na entrega");
  assert.equal(d1Done.mastery, "em-andamento");

  const d2 = await startStage(kv, U1, "desafio", today, t(70));
  const d1Ids = d1.questions.map((q) => q.id);
  assert.ok(d2.questions.every((q) => !d1Ids.includes(q.id)), "nova tentativa traz itens inéditos quando há acervo");
  await play(kv, d2, "all-right", "desafio", 71);
  const d2Done = await finishStage(kv, { unitId: U1, stage: "desafio", sessionId: d2.session.id }, today, t(90));
  assert.equal(d2Done.result.passed, true);
  assert.equal(d2Done.mastery, "concluida");

  const { states } = await loadOverview(kv);
  assert.equal(states[U1].desafio.tries.length, 2);
  assert.deepEqual(states[U1].revisao, { stage: 0, due: "2026-11-19" });
  const view2 = await unitView(kv, U2, today);
  assert.equal(view2.status.state, "disponivel", "a unidade seguinte abre");
});

test("nada de gabarito antes da hora: desafio não devolve correção nem resolução ao iniciar ou responder", async () => {
  const kv = fresh();
  await markFundamento(kv, U1, today, t(1));
  const pr = await startStage(kv, U1, "pratica", today, t(2));
  await play(kv, pr, "all-right", "pratica");
  await finishStage(kv, { unitId: U1, stage: "pratica", sessionId: pr.session.id }, today, t(20));
  const d = await startStage(kv, U1, "desafio", today, t(30));
  const text = JSON.stringify(d);
  assert.ok(!text.includes("resolutionHtml") && !text.includes("misconception"), "payload da sessão sem resolução");
  assert.deepEqual(d.corrections, {});
  const first = d.questions[0].id;
  const answered = await answerItem(kv, { unitId: U1, stage: "desafio", sessionId: d.session.id, questionId: first, selected: "A" }, t(31));
  assert.ok(!("correction" in answered), "responder no desafio não revela se acertou");
  const resumed = await startStage(kv, U1, "desafio", today, t(32));
  assert.equal(resumed.session.id, d.session.id, "retomar devolve a mesma sessão");
  assert.equal(resumed.session.answers[first], "A");
  assert.deepEqual(resumed.corrections, {});
});

test("idempotência: resposta e entrega repetidas não duplicam tentativa nem resultado", async () => {
  const kv = fresh();
  await markFundamento(kv, U1, today, t(1));
  const pr = await startStage(kv, U1, "pratica", today, t(2));
  const id = pr.questions[0].id;
  const a = await answerItem(kv, { unitId: U1, stage: "pratica", sessionId: pr.session.id, questionId: id, selected: "A" }, t(3));
  const b = await answerItem(kv, { unitId: U1, stage: "pratica", sessionId: pr.session.id, questionId: id, selected: "B" }, t(4));
  assert.equal(a.duplicate, false);
  assert.equal(b.duplicate, true);
  assert.equal(b.selected, "A", "a primeira resposta confirmada vale; o reenvio não a troca");
  assert.equal(await attemptsOf(kv, id), 1);
  await play(kv, { ...pr, questions: pr.questions.slice(1) }, "all-right", "pratica", 5);
  const f1 = await finishStage(kv, { unitId: U1, stage: "pratica", sessionId: pr.session.id }, today, t(20));
  const f2 = await finishStage(kv, { unitId: U1, stage: "pratica", sessionId: pr.session.id }, today, t(21));
  assert.equal(f2.alreadyFinished, true);
  assert.deepEqual(f2.result, f1.result);
  const [x, y] = await Promise.all([finishStage(kv, { unitId: U1, stage: "pratica", sessionId: pr.session.id }, today, t(22)), finishStage(kv, { unitId: U1, stage: "pratica", sessionId: pr.session.id }, today, t(22))]);
  assert.deepEqual(x.result, y.result);
});

test("entregas simultâneas do desafio gravam uma única tentativa", async () => {
  const kv = fresh();
  await markFundamento(kv, U1, today, t(1));
  const pr = await startStage(kv, U1, "pratica", today, t(2));
  await play(kv, pr, "all-right", "pratica");
  await finishStage(kv, { unitId: U1, stage: "pratica", sessionId: pr.session.id }, today, t(20));
  const d = await startStage(kv, U1, "desafio", today, t(30));
  await play(kv, d, "all-right", "desafio", 31);
  await Promise.all([1, 2, 3].map(() => finishStage(kv, { unitId: U1, stage: "desafio", sessionId: d.session.id }, today, t(50))));
  const { states } = await loadOverview(kv);
  assert.equal(states[U1].desafio.tries.length, 1);
});

test("permissões do servidor: bloqueio pedagógico, item fora da sessão, sessão de outra conta e unidade inexistente", async () => {
  const kv = fresh(); const other = fresh();
  await assert.rejects(() => startStage(kv, U2, "pratica", today, t(1)), (e: unknown) => e instanceof TrilhaError && e.status === 409 && /Conclua antes/.test(e.message));
  await assert.rejects(() => markFundamento(kv, U2, today, t(1)), (e: unknown) => e instanceof TrilhaError && e.code === "bloqueada");
  await assert.rejects(() => startStage(kv, "u-inexistente", "pratica", today, t(1)), (e: unknown) => e instanceof TrilhaError && e.status === 404);
  await assert.rejects(() => startStage(kv, U1, "pratica", today, t(1)), (e: unknown) => e instanceof TrilhaError && /fundamento/.test(e.message), "em Aprender, prática exige o fundamento");
  await markFundamento(kv, U1, today, t(1));
  const pr = await startStage(kv, U1, "pratica", today, t(2));
  await assert.rejects(() => answerItem(kv, { unitId: U1, stage: "pratica", sessionId: pr.session.id, questionId: "q-de-outra-unidade", selected: "A" }, t(3)), (e: unknown) => e instanceof TrilhaError && e.code === "item_invalido");
  await assert.rejects(() => answerItem(other, { unitId: U1, stage: "pratica", sessionId: pr.session.id, questionId: pr.questions[0].id, selected: "A" }, t(3)), (e: unknown) => e instanceof TrilhaError && e.status === 404, "sessão de outra conta não existe");
  await assert.rejects(() => finishStage(kv, { unitId: U1, stage: "pratica", sessionId: pr.session.id }, today, t(4)), (e: unknown) => e instanceof TrilhaError && e.code === "incompleta");
  await assert.rejects(() => startStage(kv, U1, "invalida", today, t(5)), (e: unknown) => e instanceof TrilhaError && e.status === 400);
});

test("teste de avanço: aprovado valida a unidade, abre as seguintes e agenda a revisão; modo Treinar dispensa fundamento e pré-requisito", async () => {
  const kv = fresh();
  const test1 = await startStage(kv, U2, "teste", today, t(1));
  for (const q of test1.questions) await answerItem(kv, { unitId: U2, stage: "teste", sessionId: test1.session.id, questionId: q.id, selected: right(q.id) }, t(5));
  const done = await finishStage(kv, { unitId: U2, stage: "teste", sessionId: test1.session.id }, today, t(9));
  assert.equal(done.result.passed, true);
  assert.equal(done.mastery, "validada");
  const { states } = await loadOverview(kv);
  assert.equal(masteryOf(states[U2]), "validada");
  assert.equal(states[U2].revisao?.due, "2026-11-19");
  assert.equal((await unitView(kv, "u-mat-graficos-tabelas", today)).status.state, "disponivel");
  assert.equal((await unitView(kv, U1, today)).status.state, "disponivel", "pré-requisito não verificado continua por fazer");

  const kv2 = fresh();
  await setPrefs(kv2, { modo: "treinar", serie: "2" });
  const free = await startStage(kv2, U2, "desafio", today, t(1));
  assert.equal(free.questions.length, 5, "Treinar: desafio direto, sem fundamento nem pré-requisito");
});

test("revisão espaçada: vence no dia, avança ao acertar, volta ao início ao errar", async () => {
  const kv = fresh();
  await markFundamento(kv, U1, today, t(1));
  const pr = await startStage(kv, U1, "pratica", today, t(2));
  await play(kv, pr, "all-right", "pratica");
  await finishStage(kv, { unitId: U1, stage: "pratica", sessionId: pr.session.id }, today, t(20));
  const d = await startStage(kv, U1, "desafio", today, t(30));
  await play(kv, d, "all-right", "desafio", 31);
  await finishStage(kv, { unitId: U1, stage: "desafio", sessionId: d.session.id }, today, t(50));
  await assert.rejects(() => startStage(kv, U1, "revisao", today, t(60)), (e: unknown) => e instanceof TrilhaError && /agendada/.test(e.message));
  const next = "2026-11-19";
  const rv = await startStage(kv, U1, "revisao", next, new Date("2026-11-19T12:00:00Z"));
  assert.equal(rv.questions.length, 3);
  for (const q of rv.questions) await answerItem(kv, { unitId: U1, stage: "revisao", sessionId: rv.session.id, questionId: q.id, selected: right(q.id) }, new Date("2026-11-19T12:01:00Z"));
  const rvDone = await finishStage(kv, { unitId: U1, stage: "revisao", sessionId: rv.session.id }, next, new Date("2026-11-19T12:05:00Z"));
  assert.equal(rvDone.result.passed, true);
  assert.equal((await loadOverview(kv)).states[U1].revisao?.due, "2026-11-22");
  const rv2 = await startStage(kv, U1, "revisao", "2026-11-22", new Date("2026-11-22T12:00:00Z"));
  for (const q of rv2.questions) await answerItem(kv, { unitId: U1, stage: "revisao", sessionId: rv2.session.id, questionId: q.id, selected: wrong(q.id) }, new Date("2026-11-22T12:01:00Z"));
  await finishStage(kv, { unitId: U1, stage: "revisao", sessionId: rv2.session.id }, "2026-11-22", new Date("2026-11-22T12:05:00Z"));
  assert.equal((await loadOverview(kv)).states[U1].revisao?.due, "2026-11-23", "erro: volta ao início");
  assert.equal((await masteryAfter(kv)), "concluida", "o domínio continua visível durante a revisão");
});
async function masteryAfter(kv: ReturnType<typeof fresh>) { return masteryOf((await loadOverview(kv)).states[U1]); }

test("preferências: série e modo guardados e validados; sugestão do Início segue a Trilha", async () => {
  const kv = fresh();
  assert.deepEqual(await setPrefs(kv, { serie: "9", modo: "xxx" }), { serie: "", modo: "aprender" }, "valores inválidos são ignorados");
  assert.deepEqual(await setPrefs(kv, { serie: "3", modo: "treinar" }), { serie: "3", modo: "treinar" });
  const start = await trilhaForToday({ kv }, today);
  assert.equal(start?.unitId, U1);
  assert.equal(start?.started, false);
  await setCursor(kv, { unitId: U1, stage: "pratica", sessionId: "x", cursor: 1 }).catch((e: unknown) => assert.ok(e instanceof TrilhaError));
  const kv2 = fresh();
  await markFundamento(kv2, U1, today, t(1)).catch(() => undefined);
  const cont = await trilhaForToday({ kv: kv2 }, today);
  assert.equal(cont?.started, true);
  assert.match(cont!.reason, /Próxima etapa/);
  assert.match(cont!.href, /\/pratica$/);
});
