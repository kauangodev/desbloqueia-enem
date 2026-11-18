import assert from "node:assert/strict";
import test from "node:test";
import { applyFilters, emptyFilters, parseFilters, serializeFilters, type FilterableMeta } from "../lib/operacao/filters";

const qp = (query: string) => new URLSearchParams(query);
const metas: FilterableMeta[] = [
  { id: "a", discipline: "matematica", topic: "Porcentagem", moduleId: "m1", origin: "oficial", difficulty: "media", minutes: 2, year: 2023 },
  { id: "b", discipline: "matematica", topic: "Geometria", moduleId: "m2", origin: "autoral", difficulty: "facil", minutes: 3 },
  { id: "c", discipline: "fisica", topic: "Energia", moduleId: "m3", origin: "autoral", difficulty: "dificil", minutes: 4 },
];
const state = { attempts: { a: { last: false, everWrong: true }, b: { last: true, everWrong: false } }, fav: ["c"], later: [] as string[] };

test("filtros: ida e volta pela URL, e valores inválidos viram o padrão", () => {
  const filters = parseFilters(qp("d=fisica&df=dificil&s=erradas&q=ener&n=3"));
  assert.equal(filters.discipline, "fisica");
  assert.equal(filters.position, 3);
  assert.equal(parseFilters(qp(serializeFilters(filters))).status, "erradas");
  const bad = parseFilters(qp("d=historia&o=xx&df=9&y=20&dur=infinita&s=tudo&n=-4&t=" + "x".repeat(300)));
  assert.deepEqual({ ...bad, topic: "" }, { ...emptyFilters });
  assert.equal(bad.topic.length, 80, "texto é truncado, não rejeitado");
});

test("tópico e módulo desconhecidos são descartados quando o catálogo é informado", () => {
  const filters = parseFilters(qp("t=Inventado&m=zzz"), { topics: ["Porcentagem"], modules: ["m1"] });
  assert.equal(filters.topic, "");
  assert.equal(filters.moduleId, "");
  assert.equal(parseFilters(qp("t=Porcentagem&m=m1"), { topics: ["Porcentagem"], modules: ["m1"] }).topic, "Porcentagem");
});

test("serialização omite padrões e posição 1", () => {
  assert.equal(serializeFilters(emptyFilters), "");
  assert.equal(serializeFilters({ ...emptyFilters, discipline: "fisica", position: 1 }), "d=fisica");
});

test("filtros combinados por disciplina, ano, status e dificuldade", () => {
  const run = (patch: Partial<typeof emptyFilters>, view: "questoes" | "erros" = "questoes") => applyFilters(metas, { ...emptyFilters, ...patch }, state, view).map((q) => q.id);
  assert.deepEqual(run({}), ["a", "b", "c"]);
  assert.deepEqual(run({ discipline: "matematica" }), ["a", "b"]);
  assert.deepEqual(run({ year: "2023" }), ["a"]);
  assert.deepEqual(run({ status: "erradas" }), ["a"]);
  assert.deepEqual(run({ status: "nao" }), ["c"]);
  assert.deepEqual(run({ status: "favoritas" }), ["c"]);
  assert.deepEqual(run({ difficulty: "facil", discipline: "matematica" }), ["b"]);
  assert.deepEqual(run({ duration: "curta" }), ["a"]);
  assert.deepEqual(run({ duration: "longa" }), ["c"]);
  assert.deepEqual(run({ search: "geom" }), ["b"]);
  assert.deepEqual(run({}, "erros"), ["a"], "caderno de erros: só o que errou ou marcou");
  assert.deepEqual(run({ discipline: "fisica", year: "2023" }), []);
});
