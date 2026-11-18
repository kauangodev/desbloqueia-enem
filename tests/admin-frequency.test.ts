import assert from "node:assert/strict";
import test from "node:test";
import { activityFromRows, conversion, frequency } from "../lib/admin/frequency";

test("frequência: só atividade pedagógica conta, no fuso de São Paulo, sem duplicar dias", () => {
  const f = frequency({
    answerTimes: ["2026-11-18T02:00:00Z", "2026-11-17T20:00:00Z", "2026-11-10T15:00:00Z"], // os dois primeiros caem em 17/11 (BRT)
    moduleTimes: ["2026-11-16T12:00:00Z"],
    sessionTimes: [],
  }, "2026-11-18");
  assert.deepEqual(f.activeDays, ["2026-11-10", "2026-11-16", "2026-11-17"]);
  assert.equal(f.active7, 2);
  assert.equal(f.active30, 3);
  assert.equal(f.lastStudyDay, "2026-11-17");
  assert.equal(f.streak, 2); // 16 e 17 (hoje ainda não estudou)
  assert.equal(f.hasData, true);
});

test("frequência: sem atividade mostra 'sem dados' e não inventa", () => {
  const f = frequency({ answerTimes: [], moduleTimes: [], sessionTimes: [] }, "2026-11-18");
  assert.equal(f.hasData, false);
  assert.equal(f.lastStudyDay, null);
  assert.equal(f.streak, 0);
});

test("linhas do estado: tentativa, sessão finalizada e módulo concluído; JSON inválido é ignorado", () => {
  const out = activityFromRows([
    { kind: "attempt", data: JSON.stringify({ history: [{ at: "2026-11-17T12:00:00Z" }, { at: "2026-11-18T12:00:00Z" }] }) },
    { kind: "session", data: { finishedAt: "2026-11-16T12:00:00Z" } },
    { kind: "session", data: { startedAt: "2026-11-15T12:00:00Z" } },
    { kind: "read", data: { concluded: true, at: "2026-11-14T12:00:00Z" } },
    { kind: "read", data: { concluded: false, at: "2026-11-13T12:00:00Z" } },
    { kind: "attempt", data: "{quebrado" },
  ]);
  assert.equal(out.answerTimes.length, 2);
  assert.equal(out.sessionTimes.length, 1);
  assert.equal(out.moduleTimes.length, 1);
});

test("conversão por coorte: denominador é o cadastro verificado do período", () => {
  assert.deepEqual(conversion([{ userId: "a", firstPaidAt: "2026-11-20" }, { userId: "b", firstPaidAt: null }, { userId: "c", firstPaidAt: null }, { userId: "d", firstPaidAt: null }]), { total: 4, paid: 1, rate: 25 });
  assert.equal(conversion([]).rate, null);
});
