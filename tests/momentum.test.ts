import assert from "node:assert/strict";
import test from "node:test";
import { momentum, XP_PER_ANSWER, XP_PER_MODULE, XP_PER_SESSION } from "../lib/operacao/momentum";

// Horário de meio-dia em São Paulo (UTC-3) para não cair em virada de dia por fuso.
const at = (day: string) => `${day}T15:00:00.000Z`;
const base = { answerTimes: [] as string[], firstAttemptTimes: [] as string[], moduleTimes: [] as string[], sessionTimes: [] as string[], questionsToday: 0, firstTryDays: [] as string[], today: "2026-11-18", dailyGoal: 10 };

test("sem atividade: tudo zerado e nenhuma missão concluída", () => {
  const m = momentum(base);
  assert.equal(m.streak, 0);
  assert.equal(m.xp, 0);
  assert.equal(m.level, 1);
  assert.equal(m.missionsDone, 0);
  assert.equal(m.week.length, 7);
  assert.equal(m.week.at(-1)?.today, true);
});

test("sequência conta dias consecutivos terminando hoje ou ontem, e quebra com lacuna", () => {
  const consecutive = momentum({ ...base, answerTimes: [at("2026-11-16"), at("2026-11-17"), at("2026-11-18")] });
  assert.equal(consecutive.streak, 3);
  assert.equal(consecutive.studiedToday, true);
  const throughYesterday = momentum({ ...base, answerTimes: [at("2026-11-16"), at("2026-11-17")] });
  assert.equal(throughYesterday.streak, 2, "quem ainda não estudou hoje não perde a sequência de ontem");
  const gap = momentum({ ...base, answerTimes: [at("2026-11-14"), at("2026-11-18")] });
  assert.equal(gap.streak, 1);
});

test("XP vale só a primeira tentativa de cada questão; módulo e atividade somam à parte", () => {
  const m = momentum({
    ...base,
    answerTimes: [at("2026-11-18"), at("2026-11-18"), at("2026-11-18")], // 3 tentativas…
    firstAttemptTimes: [at("2026-11-18")], // …mas só 1 questão distinta
    moduleTimes: [at("2026-11-18")],
    sessionTimes: [at("2026-11-18")],
  });
  assert.equal(m.xp, XP_PER_ANSWER + XP_PER_MODULE + XP_PER_SESSION);
});

test("nível sobe a cada 100 XP e o progresso do nível reinicia", () => {
  const m = momentum({ ...base, firstAttemptTimes: Array.from({ length: 13 }, () => at("2026-11-18")) });
  assert.equal(m.xp, 130);
  assert.equal(m.level, 2);
  assert.equal(m.levelProgress, 30);
  assert.equal(m.nextLevelXp, 200);
});

test("missões do dia refletem só o que foi feito hoje", () => {
  const m = momentum({ ...base, questionsToday: 10, moduleTimes: [at("2026-11-17")], firstTryDays: ["2026-11-18", "2026-11-18", "2026-11-17"], answerTimes: [at("2026-11-18")] });
  const byId = Object.fromEntries(m.missions.map((x) => [x.id, x]));
  assert.equal(byId.questoes.done, true);
  assert.equal(byId.modulo.done, false, "módulo de ontem não conta hoje");
  assert.equal(byId.primeira.progress, 2);
  assert.equal(byId.primeira.done, false);
  assert.equal(m.missionsDone, 1);
});

test("datas inválidas são ignoradas sem quebrar", () => {
  const m = momentum({ ...base, answerTimes: ["", "não é data", at("2026-11-18")] });
  assert.equal(m.streak, 1);
});
