import assert from "node:assert/strict";
import test from "node:test";
import { recorrentes } from "../lib/aluno/recorrentes";
import type { QuestionMeta } from "../lib/operacao/types";

const meta = (id: string, topic: string, origin: QuestionMeta["origin"], year?: number): QuestionMeta => ({ id, discipline: "matematica", topic, moduleId: "m", origin, difficulty: "media", minutes: 3, year });

test("recorrentes: só tópicos com questão oficial, ordenados por edições e contagem", () => {
  const out = recorrentes([
    meta("1", "Porcentagem", "oficial", 2016), meta("2", "Porcentagem", "oficial", 2017), meta("3", "Porcentagem", "autoral"),
    meta("4", "Geometria", "oficial", 2016), meta("5", "Geometria", "oficial", 2016),
    meta("6", "Funções", "autoral"),
  ]);
  assert.deepEqual(out.rows.map((r) => r.topic), ["Porcentagem", "Geometria"]);
  assert.deepEqual(out.rows[0].years, [2016, 2017]);
  assert.equal(out.rows[0].authorial, 1);
  assert.equal(out.officialTotal, 4);
  assert.deepEqual(out.years, [2016, 2017]);
});

test("recorrentes: sem questões oficiais não inventa tendência", () => {
  const out = recorrentes([meta("1", "Funções", "autoral")]);
  assert.equal(out.rows.length, 0);
  assert.equal(out.officialTotal, 0);
});
