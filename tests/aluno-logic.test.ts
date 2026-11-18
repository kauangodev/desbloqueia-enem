import assert from "node:assert/strict";
import test from "node:test";
import { diagnose } from "../lib/operacao/diagnostic";
import { deck, FLASH_INTERVALS, isDue, nextFlash } from "../lib/operacao/flash";

const qs = [
  { id: "q1", discipline: "matematica" as const, topic: "Porcentagem" },
  { id: "q2", discipline: "matematica" as const, topic: "Porcentagem" },
  { id: "q3", discipline: "fisica" as const, topic: "Energia" },
];
const at = (day: string) => `${day}T15:00:00.000Z`;

test("diagnóstico separa acerto de primeira e resultado atual, e só aponta ponto fraco com 2+ questões", () => {
  const d = diagnose([
    { id: "q1", history: [{ ok: false, at: at("2026-11-17") }, { ok: false, at: at("2026-11-18") }] },
    { id: "q2", history: [{ ok: false, at: at("2026-11-17") }, { ok: true, at: at("2026-11-18") }] },
    { id: "q3", history: [{ ok: true, at: at("2026-11-18") }] },
  ], qs, "2026-11-18");
  assert.equal(d.total, 3);
  assert.equal(d.firstTryPct, 33);
  assert.equal(d.lastPct, 67);
  assert.equal(d.disciplines.matematica.answered, 2);
  assert.equal(d.disciplines.matematica.firstTry, 0);
  assert.equal(d.disciplines.matematica.lastOk, 1);
  assert.equal(d.weak.length, 1, "Porcentagem: 1/2 na última (50%) com 2 questões");
  assert.equal(d.weak[0].topic, "Porcentagem");
  assert.equal(d.strong.length, 0, "Energia tem só 1 questão: sem rótulo");
  assert.equal(d.series.length, 14);
  assert.equal(d.series.at(-1)?.answers, 3);
  assert.equal(d.series.at(-2)?.answers, 2);
});

test("diagnóstico ignora questões desconhecidas e históricos vazios", () => {
  const d = diagnose([{ id: "fantasma", history: [{ ok: true, at: at("2026-11-18") }] }, { id: "q1", history: [] }], qs, "2026-11-18");
  assert.equal(d.total, 0);
  assert.equal(d.firstTryPct, null);
});

test("revisão espaçada: acerto sobe de caixa, erro volta ao início, 'fácil' pula uma", () => {
  const first = nextFlash(null, "good", "2026-11-18");
  assert.equal(first.box, 1);
  assert.equal(first.due, "2026-11-19");
  const second = nextFlash(first, "good", "2026-11-19");
  assert.equal(second.box, 2);
  assert.equal(second.due, "2026-11-22");
  const easy = nextFlash(second, "easy", "2026-11-22");
  assert.equal(easy.box, 4);
  const lapse = nextFlash(easy, "again", "2026-11-30");
  assert.equal(lapse.box, 0);
  assert.equal(lapse.due, "2026-11-30");
  assert.equal(lapse.lapses, 1);
  assert.equal(lapse.reviews, 4);
});

test("caixa nunca passa do máximo", () => {
  let state = nextFlash(null, "easy", "2026-01-01");
  for (let i = 0; i < 10; i += 1) state = nextFlash(state, "easy", "2026-01-01");
  assert.equal(state.box, FLASH_INTERVALS.length - 1);
});

test("baralho do dia: vencidos primeiro (mais atrasados antes), depois novos; futuros ficam de fora", () => {
  const cards = ["a", "b", "c", "d"].map((id) => ({ id }));
  const states = { a: { box: 1, due: "2026-11-17", reviews: 1, lapses: 0 }, b: { box: 2, due: "2026-11-25", reviews: 2, lapses: 0 }, c: { box: 0, due: "2026-11-10", reviews: 1, lapses: 1 } };
  const result = deck(cards, states, "2026-11-18");
  assert.deepEqual(result.queue.map((card) => card.id), ["c", "a", "d"]);
  assert.equal(result.due, 2);
  assert.equal(result.fresh, 1);
  assert.equal(isDue(states.b, "2026-11-18"), false);
  assert.equal(isDue(undefined, "2026-11-18"), true);
});

test("baralho respeita o limite diário", () => {
  const cards = Array.from({ length: 30 }, (_, i) => ({ id: `n${i}` }));
  assert.equal(deck(cards, {}, "2026-11-18", 20).queue.length, 20);
});
test("diagnóstico por período: só conta o que caiu na janela e sinaliza amostra pequena", () => {
  const attempts = [
    { id: "q1", history: [{ ok: false, at: at("2026-10-01") }, { ok: true, at: at("2026-11-17") }] },
    { id: "q2", history: [{ ok: true, at: at("2026-11-17") }] },
    { id: "q3", history: [{ ok: true, at: at("2026-08-01") }] },
  ];
  const all = diagnose(attempts, qs, "2026-11-18");
  assert.equal(all.total, 3);
  assert.equal(all.firstAttempts, 3);
  assert.equal(all.sampleTooSmall, true);
  const week = diagnose(attempts, qs, "2026-11-18", 14, 7);
  assert.equal(week.total, 2, "q3 está fora da janela");
  assert.equal(week.firstAttempts, 1, "a 1ª tentativa de q1 foi em outubro: não entra no 'de primeira' da semana");
  assert.equal(week.firstTryPct, 100);
  assert.equal(week.lastPct, 100);
  assert.equal(week.windowDays, 7);
  const none = diagnose(attempts, qs, "2026-11-18", 14, 1);
  assert.equal(none.total, 0);
  assert.equal(none.firstTryPct, null);
});
