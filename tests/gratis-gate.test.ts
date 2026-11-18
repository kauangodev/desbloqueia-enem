import assert from "node:assert/strict";
import test from "node:test";
import { freeAnswerDecision, freeQuestionVisible, freeSessionDecision, freeUnitDecision, type FreeScope } from "../lib/planos/gate";

const scope: FreeScope = { unitId: "u-mat-a", moduleId: "mat-a", questionsPerDay: 2, sessionKinds: ["diagnostico"] };

test("grátis: só a unidade introdutória e o diagnóstico", () => {
  assert.equal(freeUnitDecision(scope, "u-mat-a").allowed, true);
  const blocked = freeUnitDecision(scope, "u-mat-b");
  assert.ok(!blocked.allowed && /Essencial/.test(blocked.message));
  assert.equal(freeSessionDecision(scope, "diagnostico").allowed, true);
  assert.equal(freeSessionDecision(scope, "sim-1").allowed, false);
  assert.equal(freeQuestionVisible(scope, { moduleId: "mat-b" }), false);
});

test("grátis: resposta fora do módulo é negada e não gasta cota", () => {
  const out = freeAnswerDecision(scope, { id: "q9", moduleId: "mat-b" }, [], "2026-11-18");
  assert.equal(out.decision.allowed, false);
  assert.deepEqual(out.uses, []);
});

test("grátis: cota diária, repetição não gasta, renova no dia seguinte", () => {
  let uses: { key: string; day: string }[] = [];
  const day = "2026-11-18";
  for (const id of ["q1", "q2"]) { const r = freeAnswerDecision(scope, { id, moduleId: "mat-a" }, uses, day); assert.equal(r.decision.allowed, true); uses = r.uses; }
  assert.equal(freeAnswerDecision(scope, { id: "q1", moduleId: "mat-a" }, uses, day).decision.allowed, true);
  const over = freeAnswerDecision(scope, { id: "q3", moduleId: "mat-a" }, uses, day);
  assert.ok(!over.decision.allowed && /2 questões grátis/.test(over.decision.message));
  assert.equal(freeAnswerDecision(scope, { id: "q3", moduleId: "mat-a" }, uses, "2026-11-19").decision.allowed, true);
});
