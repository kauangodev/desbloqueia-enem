import assert from "node:assert/strict";
import test from "node:test";
import { todayPlan, type TodayInput } from "../lib/aluno/today";

const base: TodayInput = { sessions: [], reading: null, flashDue: 0, toReview: 0, weak: [], practiced: 12, nextModule: null, minutesPerQuestion: 2, basePath: "/aluno/matematica-natureza" };

test("aluno novo: primeiro treino com duração estimada", () => {
  const { primary } = todayPlan({ ...base, practiced: 0 });
  assert.equal(primary.kind, "primeiro");
  assert.equal(primary.minutes, 10);
  assert.equal(primary.href, "/aluno/treino-rapido");
});

test("sessão em andamento tem prioridade e leva ao lugar certo; a mais avançada vence", () => {
  const { primary, others } = todayPlan({
    ...base, flashDue: 4, toReview: 3,
    sessions: [
      { kind: "treino-1", id: "treino-1-1", answered: 3, total: 20, title: "Treino 1" },
      { kind: "simulado", id: "simulado-9", answered: 40, total: 90, title: "Simulado" },
    ],
  });
  assert.equal(primary.kind, "sessao");
  assert.match(primary.title, /Simulado/);
  assert.equal(primary.minutes, 100);
  assert.equal(primary.href, "/aluno/matematica-natureza/treinos?abrir=simulado", "leva à sessão do tipo certo");
  assert.ok(others.some((item) => item.title.includes("Treino 1")), "outras sessões aparecem como opção");
  assert.ok(others.length <= 3);
});

test("sem sessão: revisões vencidas, depois caderno de erros, depois lacuna do diagnóstico", () => {
  assert.equal(todayPlan({ ...base, flashDue: 2, toReview: 5 }).primary.kind, "revisao");
  const erros = todayPlan({ ...base, toReview: 5, weak: [{ discipline: "fisica", topic: "Energia", lastPct: 25, answered: 4 }] });
  assert.equal(erros.primary.kind, "erros");
  assert.equal(erros.primary.minutes, 10);
  assert.match(erros.primary.href, /erros\?s=erradas$/);
  const lacuna = todayPlan({ ...base, weak: [{ discipline: "fisica", topic: "Energia", lastPct: 25, answered: 4 }] });
  assert.equal(lacuna.primary.kind, "lacuna");
  assert.match(lacuna.primary.reason, /25%/);
  assert.equal(lacuna.primary.href, "/aluno/treino-rapido?d=fisica");
});

test("em dia e sem pendências: próxima revisão de conteúdo; senão, treino rápido", () => {
  const modulo = todayPlan({ ...base, nextModule: { id: "mat-1", title: "Razão", minutes: 25 } });
  assert.equal(modulo.primary.kind, "modulo");
  assert.equal(modulo.primary.minutes, 25);
  assert.equal(todayPlan(base).primary.kind, "treino");
});

test("leitura em andamento aparece como alternativa, nunca bloqueia a prioridade principal", () => {
  const plan = todayPlan({ ...base, flashDue: 1, reading: { materialId: "m1", title: "Matemática", page: 12 } });
  assert.equal(plan.primary.kind, "revisao");
  assert.ok(plan.others.some((item) => item.kind === "leitura" && item.reason.includes("12")));
});

test("duração usa a média do acervo e nunca é zero ou negativa", () => {
  assert.equal(todayPlan({ ...base, practiced: 0, minutesPerQuestion: 0 }).primary.minutes, 10);
  assert.ok((todayPlan({ ...base, practiced: 0, minutesPerQuestion: 0.1 }).primary.minutes ?? 0) >= 1);
});
test("alternativas não repetem o destino da ação principal", () => {
  const novo = todayPlan({ ...base, practiced: 0 });
  assert.ok(!novo.others.some((item) => item.href === novo.primary.href));
  const hrefs = todayPlan({ ...base, nextModule: { id: "m", title: "M", minutes: 20 }, flashDue: 1 }).others.map((item) => item.href);
  assert.equal(new Set(hrefs).size, hrefs.length);
});
test("sessão antiga sem respostas não domina: a Trilha e as revisões passam à frente", () => {
  const stale = { kind: "treino-1", id: "treino-1-1", answered: 0, total: 20, title: "Treino 1", startedAt: "2026-11-10T12:00:00.000Z" };
  const plan = todayPlan({ ...base, today: "2026-11-18", sessions: [stale], flashDue: 2 });
  assert.equal(plan.primary.kind, "revisao");
  assert.ok(plan.others.some((item) => item.kind === "sessao"), "continua disponível como alternativa");
  const fresh = todayPlan({ ...base, today: "2026-11-18", sessions: [{ ...stale, startedAt: "2026-11-17T12:00:00.000Z" }], flashDue: 2 });
  assert.equal(fresh.primary.kind, "sessao", "sessão recente, mesmo sem respostas, ainda vale");
  const answered = todayPlan({ ...base, today: "2026-11-18", sessions: [{ ...stale, answered: 1 }], flashDue: 2 });
  assert.equal(answered.primary.kind, "sessao", "com resposta, a sessão antiga continua válida");
});

test("Trilha: vem depois da sessão e antes de revisões; aluno novo começa por ela", () => {
  const trilha = { unitId: "u1", title: "Razão e proporção", stageLabel: "Fundamento", reason: "Próxima etapa.", href: "/aluno/trilha/u1", minutes: 25, started: false };
  assert.equal(todayPlan({ ...base, practiced: 0, trilha }).primary.kind, "trilha");
  assert.equal(todayPlan({ ...base, trilha, flashDue: 3 }).primary.kind, "trilha");
  const withSession = todayPlan({ ...base, trilha, sessions: [{ kind: "treino-1", id: "t", answered: 5, total: 20, title: "Treino 1" }] });
  assert.equal(withSession.primary.kind, "sessao");
  assert.ok(withSession.others.some((item) => item.kind === "trilha"));
  assert.match(todayPlan({ ...base, trilha: { ...trilha, started: true } }).primary.title, /Continuar a trilha/);
});
