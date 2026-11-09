import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { coverSvg, covers, interleaved, spineSvg } from "../lib/covers";
import { modules } from "../lib/operacao/catalog";

test("16 capas: 4 por disciplina, ids únicos", () => {
  assert.equal(covers.length, 16);
  assert.equal(new Set(covers.map((c) => c.id)).size, 16);
  for (const d of ["matematica", "fisica", "quimica", "biologia"]) assert.equal(covers.filter((c) => c.discipline === d).length, 4);
});

test("as capas representam módulos realmente publicados", () => {
  const titles = new Set(modules.map((m) => m.title));
  for (const cover of covers) {
    assert.ok(cover.modules.length > 0);
    for (const title of cover.modules) assert.ok(titles.has(title), `módulo inexistente: ${title}`);
  }
});

test("a fileira intercala as quatro disciplinas", () => {
  assert.equal(interleaved.length, 16);
  assert.deepEqual(interleaved.slice(0, 4).map((c) => c.discipline), ["matematica", "fisica", "quimica", "biologia"]);
});

test("SVGs versionados em public/books são idênticos aos gerados (texto determinístico)", () => {
  for (const cover of covers) {
    for (const [prefix, svg] of [["cover", coverSvg(cover)], ["spine", spineSvg(cover)]] as const) {
      const file = join(process.cwd(), "public", "books", `${prefix}-${cover.id}.svg`);
      assert.ok(existsSync(file), `faltando ${file}`);
      assert.equal(readFileSync(file, "utf8").replace(/\r\n/g, "\n"), svg + "\n");
      for (const line of cover.lines) assert.ok(svg.includes(line));
      assert.ok(!/inep|mec\b|oficial/i.test(svg), "capa não pode sugerir selo/parceria oficial");
    }
  }
});
