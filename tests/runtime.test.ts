import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeMysqlRow, mysqlWriteValue, mysqlPrimaryKeys } from "../lib/mysql-values";
import { studyDate, levelFor, summarizeStudyDays } from "../lib/gamification-rules";

test("contrato MySQL converte apenas booleanos conhecidos e JSON", () => {
  assert.deepEqual(normalizeMysqlRow({ done: 0, enabled: 1, title: "1", answers: '{"q":"B"}' }), { done: false, enabled: true, title: "1", answers: { q: "B" } });
});
test("data de calendário preserva YYYY-MM-DD e timestamp vira ISO", () => {
  assert.deepEqual(normalizeMysqlRow({ date_value: "2026-10-28", updated_at: new Date("2026-10-28T02:00:00Z") }), { date: "2026-10-28", updated_at: "2026-10-28T02:00:00.000Z" });
});
test("escrita não transforma Date em string JSON nem texto do aluno em data", () => {
  const date = new Date("2026-10-28T02:00:00Z");
  assert.equal(mysqlWriteValue("updated_at", date), date);
  assert.ok(mysqlWriteValue("updated_at", date.toISOString()) instanceof Date);
  assert.equal(mysqlWriteValue("title", date.toISOString()), date.toISOString());
  assert.equal(mysqlWriteValue("answers", { q: "A" }), '{"q":"A"}');
});
test("chave de progresso é composta para atualizações repetidas", () => {
  assert.equal(mysqlPrimaryKeys.reading_progress, "user_id,material_id");
});
test("dia de estudo respeita virada da meia-noite em São Paulo", () => {
  assert.equal(studyDate(new Date("2026-10-28T02:59:59Z")), "2026-10-27");
  assert.equal(studyDate(new Date("2026-10-28T03:00:00Z")), "2026-10-28");
});
test("sequência não conta dias avulsos como consecutivos", () => {
  assert.deepEqual(summarizeStudyDays(["2026-10-24", "2026-10-26", "2026-10-27", "2026-10-27"], "2026-10-28"), { studyDays: 3, streak: 2 });
  assert.equal(summarizeStudyDays(["2026-10-24"], "2026-10-28").streak, 0);
});
test("nível respeita limite e não aceita XP negativo", () => {
  assert.deepEqual(levelFor(-50), { level: 1, nextLevelXp: 100 });
  assert.deepEqual(levelFor(100), { level: 2, nextLevelXp: 200 });
});
test("leitor e build publicam o mesmo worker PDF.js", () => {
  const reader = readFileSync("components/pdf-reader.tsx", "utf8");
  const generator = readFileSync("scripts/pdf-worker.mjs", "utf8");
  assert.ok(reader.includes('/vendor/pdf.worker.min.js'));
  assert.ok(generator.includes('public/vendor/pdf.worker.min.mjs'));
});

