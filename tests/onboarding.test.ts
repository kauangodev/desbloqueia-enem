import assert from "node:assert/strict";
import test from "node:test";
import { ageOn, applyStep, emptyState, validateBirthDate, validateGoals, validateRoutine } from "../lib/onboarding/model";

const TODAY = "2026-11-19";
const NOW = "2026-11-19T12:00:00.000Z";

test("data de nascimento: calendário real, bissexto, futuro e idade plausível", () => {
  assert.equal(validateBirthDate("2008-02-29", TODAY).ok, true); // 2008 foi bissexto
  assert.equal(validateBirthDate("2007-02-29", TODAY).ok, false); // 2007 não foi bissexto
  assert.equal(validateBirthDate("2005-13-01", TODAY).ok, false);
  assert.equal(validateBirthDate("2005-02-30", TODAY).ok, false);
  assert.equal(validateBirthDate("2027-01-01", TODAY).ok, false); // futuro
  assert.equal(validateBirthDate("2020-01-01", TODAY).ok, false); // idade implausível
  assert.equal(validateBirthDate("1900-01-01", TODAY).ok, false);
  assert.equal(validateBirthDate("19/03/2005", TODAY).ok, false); // só AAAA-MM-DD chega ao servidor
  assert.equal(validateBirthDate(20050319, TODAY).ok, false);
  assert.equal(validateBirthDate("2005-03-19", TODAY).ok, true);
});

test("idade no dia exato do aniversário e na véspera", () => {
  assert.equal(ageOn("2008-11-19", TODAY), 18);
  assert.equal(ageOn("2008-11-20", TODAY), 17);
  assert.equal(ageOn("2008-12-01", "2026-11-30"), 17);
});

test("objetivo: 'não sei' é null (nunca zero), limites e lista de exames", () => {
  const unknown = validateGoals({ scoreUnknown: true, scoreCurrent: 700, scoreTarget: 800 });
  assert.ok(unknown.ok && unknown.value.scoreCurrent === null && unknown.value.scoreUnknown === true && unknown.value.scoreTarget === 800);
  const empty = validateGoals({});
  assert.ok(empty.ok && empty.value.scoreCurrent === null && empty.value.scoreTarget === null);
  assert.equal(validateGoals({ scoreCurrent: 1001 }).ok, false);
  assert.equal(validateGoals({ scoreCurrent: -1 }).ok, false);
  assert.equal(validateGoals({ scoreCurrent: 650.5 }).ok, false);
  assert.equal(validateGoals({ scoreTarget: "800" }).ok, false);
  assert.equal(validateGoals({ futureExams: ["Aprova"] }).ok, false);
  const ok = validateGoals({ scoreCurrent: 620, scoreTarget: 600, futureExams: ["FUVEST", "FUVEST"] }); // meta menor que a nota atual não é barrada
  assert.ok(ok.ok && ok.value.futureExams.length === 1);
});

test("ritmo: três fixos, personalizado com limites", () => {
  const regular = validateRoutine("regular", undefined);
  assert.ok(regular.ok && regular.value.dailyQuestions === 6);
  assert.equal(validateRoutine("personalizado", 0).ok, false);
  assert.equal(validateRoutine("personalizado", 31).ok, false);
  assert.equal(validateRoutine("personalizado", 12).ok, true);
  assert.equal(validateRoutine("puxada", undefined).ok, false);
});

test("etapas: a 1 é obrigatória, 2 e 3 podem ser puladas, concluir marca a data e não regride", () => {
  let state = emptyState();
  assert.equal(applyStep(state, { step: 2, skip: true }, TODAY, NOW).ok, false); // sem a etapa 1
  const s1 = applyStep(state, { step: 1, birthDate: "2005-03-19" }, TODAY, NOW);
  assert.ok(s1.ok && s1.value.step === 2); state = (s1 as { value: typeof state }).value;
  const s2 = applyStep(state, { step: 2, skip: true }, TODAY, NOW);
  assert.ok(s2.ok && s2.value.skipped.includes(2) && s2.value.step === 3); state = (s2 as { value: typeof state }).value;
  const s3 = applyStep(state, { step: 3, routine: "leve" }, TODAY, NOW);
  assert.ok(s3.ok && s3.value.completedAt === NOW && s3.value.dailyQuestions === 3); state = (s3 as { value: typeof state }).value;
  // refazer a etapa 1 depois de concluído não volta o progresso nem apaga a conclusão
  const again = applyStep(state, { step: 1, birthDate: "2005-03-20" }, TODAY, "2026-11-20T00:00:00.000Z");
  assert.ok(again.ok && again.value.step === 3 && again.value.completedAt === NOW);
  // entrada inválida não altera o estado anterior
  assert.equal(applyStep(state, { step: 3, routine: "x" }, TODAY, NOW).ok, false);
  assert.equal(state.dailyQuestions, 3);
});
