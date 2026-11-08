import assert from "node:assert/strict";
import test from "node:test";
import { formulaCards } from "../data/operacao/formulas";
import { allModules as operacaoModules } from "../lib/operacao/catalog";
import { operacaoQuestions } from "../data/operacao/questions";
import { grade, modules, questionById, questions, toPublic } from "../lib/operacao/catalog";
import { campaignStatus, daysBetween, todayInSaoPaulo } from "../lib/operacao/config";
import { limitFor, remainingMs, selectQuestions, summarize, type Session } from "../lib/operacao/engine";
import { buildPlan } from "../lib/operacao/plan";
import { validateCatalog } from "../lib/operacao/validate";

const catalog = { moduleTitle: (id: string) => modules.find((m) => m.id === id)?.title ?? null, moduleMinutes: () => 20, moduleDiscipline: (id: string) => modules.find((m) => m.id === id)?.discipline };

test("o acervo não tem erros de integridade", () => {
  const errors = validateCatalog(operacaoModules, operacaoQuestions, formulaCards).filter((i) => i.level === "erro");
  assert.deepEqual(errors, []);
});

test("o validador detecta duplicidade, múltiplas corretas e metadados oficiais incompletos", () => {
  const base = operacaoQuestions[0];
  const broken = [
    { ...base },
    { ...base },
    { ...operacaoQuestions[1], id: "x-1", options: operacaoQuestions[1].options.map((o) => ({ ...o, text: "igual" })) },
    { ...operacaoQuestions[2], id: "x-2", origin: "oficial" as const, official: undefined },
    { ...operacaoQuestions[3], id: "x-3", resolution: "" },
    { ...operacaoQuestions[4], id: "x-4", moduleId: "inexistente" },
    { ...operacaoQuestions[5], id: "x-5", figure: { src: "/nao-existe.png", alt: "" } },
  ];
  const messages = validateCatalog(operacaoModules, broken, formulaCards, { figureExists: () => false }).map((i) => i.message).join("|");
  for (const part of ["ID duplicado", "alternativas repetidas", "metadados oficiais incompletos", "resolução vazia", "módulo inexistente", "figura sem texto alternativo", "imagem ausente"]) assert.ok(messages.includes(part), part);
});

test("a versão pública da questão não vaza gabarito nem resolução", () => {
  for (const q of questions) {
    const json = JSON.stringify(toPublic(q));
    assert.ok(!("answer" in toPublic(q)));
    assert.ok(!json.includes(q.resolution.slice(0, 40)));
  }
});

test("a correção só marca como correta a alternativa do gabarito", () => {
  const q = questions[0];
  assert.equal(grade(q, q.answer).correct, true);
  const wrong = q.options.find((o) => o.id !== q.answer)!.id;
  assert.equal(grade(q, wrong).correct, false);
  assert.equal(grade(q, null).correct, false);
});

test("questões oficiais têm metadados completos e as autorais nunca citam o Inep", () => {
  for (const q of questions) {
    if (q.origin === "oficial") assert.ok(q.official?.year && q.official.number && q.official.sourceUrl.startsWith("https://www.gov.br/inep"));
    else assert.equal(q.official, undefined);
  }
});

test("seleção de treino: sem repetição e só com questões publicadas", () => {
  for (const kind of ["diagnostico", "treino-1", "treino-2", "treino-3", "simulado"] as const) {
    const pick = selectQuestions(kind, new Set());
    assert.equal(new Set(pick.ids).size, pick.ids.length, kind);
    assert.ok(pick.ids.every((id) => questionById(id)), kind);
    assert.ok(pick.math.length <= pick.shortfall.per && pick.nature.length <= pick.shortfall.per);
  }
});

test("seleção prefere questões ainda não vistas", () => {
  const first = selectQuestions("treino-1", new Set());
  const second = selectQuestions("treino-1", new Set(first.ids));
  const overlap = second.ids.filter((id) => first.ids.includes(id));
  assert.ok(overlap.length < first.ids.length, "algo novo deve entrar quando há acervo disponível");
});

test("limite de tempo: ausente nos modos livre/prática e proporcional no simulado", () => {
  assert.equal(limitFor("simulado", "pratica", 90), null);
  assert.equal(limitFor("treino-1", "livre", 20), null);
  assert.equal(limitFor("simulado", "prova", 90), 300 * 60000);
  assert.equal(limitFor("simulado", "prova", 45), 150 * 60000);
});

test("cronômetro é calculado pelo servidor e não reinicia", () => {
  const started = Date.now() - 10 * 60000;
  const session = { startedAt: new Date(started).toISOString(), limitMs: 30 * 60000 } as Session;
  const left = remainingMs(session, Date.now())!;
  assert.ok(left > 19 * 60000 - 2000 && left <= 20 * 60000);
  assert.equal(remainingMs({ ...session, startedAt: new Date(Date.now() - 31 * 60000).toISOString() } as Session), 0);
  assert.equal(remainingMs({ ...session, limitMs: null } as Session), null);
});

test("resumo trata questões em branco e calcula por disciplina", () => {
  const ids = selectQuestions("diagnostico", new Set()).ids;
  const answers: Record<string, string> = {};
  const [firstId] = ids;
  answers[firstId] = questionById(firstId)!.answer;
  const session = { id: "s", kind: "diagnostico", mode: "livre", questionIds: ids, answers, flags: {}, startedAt: new Date().toISOString(), limitMs: null } as Session;
  const result = summarize(session);
  assert.equal(result.total, ids.length);
  assert.equal(result.correct, 1);
  assert.equal(result.blank, ids.length - 1);
  assert.equal(Object.values(result.byDiscipline).reduce((s, d) => s + d.total, 0), ids.length);
});

test("datas: fuso de São Paulo e fases da campanha", () => {
  assert.equal(todayInSaoPaulo(new Date("2026-11-09T02:30:00Z")), "2026-11-08");
  assert.equal(daysBetween("2026-11-08", "2026-11-15"), 7);
  assert.equal(campaignStatus("2026-11-08").phase, "antes");
  assert.equal(campaignStatus("2026-11-15").phase, "dia");
  assert.equal(campaignStatus("2026-11-16").phase, "depois");
  assert.match(campaignStatus("2026-11-14").headline, /amanhã/);
});

test("plano só cobre os dias restantes e cabe no tempo escolhido", () => {
  const plan = buildPlan(60, "2026-11-10", catalog);
  assert.equal(plan[0].date, "2026-11-10");
  assert.equal(plan.at(-1)!.date, "2026-11-15");
  assert.ok(plan.at(-1)!.isExamDay);
  for (const day of plan.filter((d) => !d.isExamDay)) assert.ok(day.totalMinutes <= 60, `${day.date} ${day.totalMinutes}`);
  assert.equal(new Set(plan.flatMap((d) => d.tasks.map((t) => t.id))).size, plan.flatMap((d) => d.tasks).length, "ids de tarefa únicos");
  assert.deepEqual(buildPlan(30, "2026-11-16", catalog), []);
  assert.equal(plan.find((d) => d.date === "2026-11-15")!.tasks.length, 1);
});

test("plano de 30 min nunca passa de 30 por dia", () => {
  for (const day of buildPlan(30, "2026-11-09", catalog).filter((d) => !d.isExamDay)) assert.ok(day.totalMinutes <= 30, `${day.date} ${day.totalMinutes}`);
});

test("embaralhamento do gabarito preserva a alternativa correta e as explicações dos distratores", async () => {
  const { placeAnswer } = await import("../data/operacao/qbuild");
  const opts = ["um", "dois", "três", "quatro", "cinco"];
  for (const id of ["a", "b", "c", "d", "e", "f", "g"]) {
    const placed = placeAnswer(id, opts, "C", { A: "sobre um", E: "sobre cinco" });
    assert.equal(placed.options.find((o) => o.id === placed.answer)!.text, "três");
    assert.equal(placed.options.find((o) => o.id === Object.keys(placed.distractors).find((k) => placed.distractors[k as "A"] === "sobre um"))!.text, "um");
    assert.equal(placed.options.find((o) => o.id === Object.keys(placed.distractors).find((k) => placed.distractors[k as "A"] === "sobre cinco"))!.text, "cinco");
    assert.equal(new Set(placed.options.map((o) => o.text)).size, 5);
  }
});

test("a distribuição das letras corretas é equilibrada (nenhuma passa de 30%)", () => {
  const counts: Record<string, number> = {};
  for (const q of questions) counts[q.answer] = (counts[q.answer] || 0) + 1;
  for (const [letter, n] of Object.entries(counts)) assert.ok(n / questions.length <= 0.3, `${letter}: ${n}`);
});

test("metas editoriais: 32 módulos e 240 questões com a distribuição pedida", async () => {
  const { editorialTargets } = await import("../lib/operacao/validate");
  assert.equal(modules.length, editorialTargets.modules);
  assert.equal(questions.length, editorialTargets.total);
  for (const [d, n] of Object.entries(editorialTargets.questions)) assert.equal(questions.filter((q) => q.discipline === d).length, n, d);
  const mods = (d: string) => modules.filter((m) => m.discipline === d).length;
  assert.deepEqual([mods("matematica"), mods("fisica"), mods("quimica"), mods("biologia")], [12, 6, 6, 8]);
});

test("com o acervo completo, o simulado tem 45 + 45 e o diagnóstico 8 + 8, sem repetição", () => {
  const sim = selectQuestions("simulado", new Set());
  assert.equal(sim.math.length, 45); assert.equal(sim.nature.length, 45);
  assert.equal(new Set(sim.ids).size, 90);
  const dia = selectQuestions("diagnostico", new Set());
  assert.equal(dia.math.length, 8); assert.equal(dia.nature.length, 8);
  for (const kind of ["treino-1", "treino-2", "treino-3"] as const) { const t = selectQuestions(kind, new Set()); assert.equal(t.math.length, 10); assert.equal(t.nature.length, 10); }
  const natureByDiscipline = new Set(sim.nature.map((q) => q.discipline));
  assert.equal(natureByDiscipline.size, 3);
});

test("acervo ampliado: 600 questões únicas, 4 simulados novos de 90 sem repetição e 8 treinos novos de 20", async () => {
  const { kindIds, sessionKinds } = await import("../lib/operacao/kinds");
  assert.equal(new Set(questions.map((q) => q.id)).size, 600);
  const simKinds = kindIds.filter((k) => sessionKinds[k].group === "simulado" && k.startsWith("sim-"));
  assert.equal(simKinds.length, 4);
  const used = new Set<string>();
  for (const kind of simKinds) {
    const pick = selectQuestions(kind, new Set());
    assert.equal(pick.math.length, 45, kind); assert.equal(pick.nature.length, 45, kind);
    for (const d of ["fisica", "quimica", "biologia"]) assert.equal(pick.nature.filter((x) => x.discipline === d).length, 15, `${kind} ${d}`);
    for (const id of pick.ids) { assert.ok(!used.has(id), `${id} repetida entre simulados`); used.add(id); }
  }
  assert.equal(used.size, 360);
  const treinos = kindIds.filter((k) => /^treino-(4|5|6|7|8|9|10|11)$/.test(k));
  assert.equal(treinos.length, 8);
  for (const kind of treinos) { const p = selectQuestions(kind, new Set()); assert.equal(p.math.length, 10, kind); assert.equal(p.nature.length, 10, kind); assert.equal(new Set(p.ids).size, 20, kind); }
});

test("o acervo base (240) e os simulados novos (360) não se misturam; oficiais ficam no acervo base", () => {
  const base = questions.filter((q) => (q.bank ?? "base") === "base");
  assert.equal(base.length, 240);
  assert.ok(questions.filter((q) => q.origin === "oficial").every((q) => (q.bank ?? "base") === "base"));
  for (const bank of ["s1", "s2", "s3", "s4"]) assert.equal(questions.filter((q) => q.bank === bank).length, 90, bank);
});

test("treinos novos preferem itens inéditos", () => {
  const first = selectQuestions("treino-11", new Set());
  const next = selectQuestions("treino-11", new Set(first.ids));
  assert.equal(next.ids.filter((id) => first.ids.includes(id)).length, 0, "com 600 itens há inéditos suficientes");
});
