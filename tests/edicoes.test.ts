import assert from "node:assert/strict";
import test from "node:test";
import { editions } from "../data/edicoes";
import { activeEdition, calendarNote, editionState, validateEdition, type Edition } from "../lib/edicoes/model";

const e2027 = editions.find((e) => e.key === "enem-2027")!;
const e2026 = editions.find((e) => e.key === "enem-2026")!;
const confirmed = (days: string[]): Edition => ({
  key: "enem-2027", exam: "enem", year: 2027, label: "ENEM 2027", status: "ativa",
  events: days.map((d, i) => ({ key: `prova-dia-${i + 1}`, kind: i === 0 ? "prova-dia-1" : "prova-dia-2", label: `dia ${i + 1}`, date: d, status: "confirmado", sourceUrl: "https://www.gov.br/inep/" })),
});

test("dados versionados são válidos e há exatamente uma edição ativa (2027)", () => {
  for (const e of editions) assert.deepEqual(validateEdition(e), [], e.key);
  assert.equal(activeEdition(editions)?.key, "enem-2027");
  assert.equal(e2026.status, "arquivada");
});

test("2027 sem data oficial: nunca estima a partir de 2026, sem contagem regressiva", () => {
  assert.ok(e2027.events.every((e) => e.date === null && e.status === "a-confirmar"), "nenhuma data estimada");
  const s = editionState(e2027, "2026-11-18");
  assert.deepEqual({ phase: s.phase, confirmed: s.calendarConfirmed, days: s.daysToNextExam, next: s.nextExam }, { phase: "preparacao", confirmed: false, days: null, next: null });
  const note = calendarNote(e2027, "2026-11-18");
  assert.equal(note.headline, "Calendário oficial do ENEM 2027 a confirmar");
  assert.equal(note.countdown, null);
  assert.match(note.detail, /por semanas/);
  assert.ok(!/2026/.test(note.headline + note.detail), "sem datas ou anos de 2026 na mensagem");
});

test("data futura confirmada: contagem regressiva em dias civis de São Paulo", () => {
  const ed = confirmed(["2027-11-07", "2027-11-14"]);
  const s = editionState(ed, "2027-11-01");
  assert.equal(s.phase, "preparacao");
  assert.equal(s.daysToNextExam, 6);
  assert.equal(calendarNote(ed, "2027-11-01").countdown, "Faltam 6 dias.");
  assert.equal(calendarNote(ed, "2027-11-06").countdown, "Falta 1 dia.");
  assert.match(calendarNote(ed, "2027-11-01").headline, /7 de novembro de 2027/);
});

test("dia de prova e pós-prova", () => {
  const ed = confirmed(["2027-11-07", "2027-11-14"]);
  assert.equal(editionState(ed, "2027-11-07").phase, "dia-de-prova");
  assert.equal(editionState(ed, "2027-11-10").phase, "preparacao", "entre os dois dias ainda há prova a vir");
  assert.equal(editionState(ed, "2027-11-14").phase, "dia-de-prova");
  const after = editionState(ed, "2027-11-15");
  assert.deepEqual({ phase: after.phase, d: after.daysToNextExam }, { phase: "pos-prova", d: null });
  assert.equal(calendarNote(ed, "2027-11-15").countdown, null);
  assert.match(calendarNote(ed, "2027-12-20").headline, /já terminou/);
});

test("ano do exame x ano do evento: evento de 2026 da edição 2027 não vira 'prova de 2026'", () => {
  const ed: Edition = { ...e2027, events: [...e2027.events, { key: "inscricao-2", kind: "inscricao", label: "Inscrições (2ª fase)", date: "2026-12-10", status: "confirmado", sourceUrl: "https://www.gov.br/inep/" }] };
  assert.deepEqual(validateEdition(ed), []);
  const s = editionState(ed, "2026-12-01");
  assert.equal(s.nextEvent?.key, "inscricao-2");
  assert.equal(s.calendarConfirmed, false, "inscrição confirmada não confirma a prova");
  assert.equal(calendarNote(ed, "2026-12-01").headline, "Calendário oficial do ENEM 2027 a confirmar");
  assert.ok(editionState(e2026, "2027-01-20").phase === "pos-prova", "2026 em janeiro de 2027: pós-prova");
});

test("validação recusa estimativa disfarçada, confirmado sem fonte e datas inválidas", () => {
  const bad: Edition = { ...e2027, events: [
    { key: "a", kind: "outro", label: "x", date: "2027-11-07", status: "a-confirmar" },
    { key: "b", kind: "outro", label: "x", date: null, status: "confirmado" },
    { key: "c", kind: "outro", label: "x", date: "2027-13-40", status: "confirmado", sourceUrl: "u" },
    { key: "c", kind: "outro", label: "x", date: null, status: "a-confirmar", time: "25:00" },
  ] };
  const problems = validateEdition(bad).join(" | ");
  assert.match(problems, /a confirmar não pode ter data/);
  assert.match(problems, /confirmado sem data válida/);
  assert.match(problems, /confirmado sem fonte/);
  assert.match(problems, /duplicado/);
  assert.match(problems, /horário inválido/);
});
