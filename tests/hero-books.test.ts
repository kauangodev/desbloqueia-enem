import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import sharp from "sharp";
import { ebookMaterials } from "../lib/ebook-catalog";
import { bookSequence, COVER_RATIO, heroBooks } from "../lib/hero-books";

test("a hero usa as capas reais do catálogo (Matemática, Física, Química, Biologia)", () => {
  assert.deepEqual(heroBooks.map((b) => b.slug), ["matematica", "fisica", "quimica", "biologia"]);
  assert.deepEqual(heroBooks.map((b) => b.cover), [
    "/covers/enem-2026/optimized/15-matematica-640.webp",
    "/covers/enem-2026/optimized/14-fisica-640.webp",
    "/covers/enem-2026/optimized/13-quimica-640.webp",
    "/covers/enem-2026/optimized/12-biologia-640.webp",
  ]);
  for (const book of heroBooks) {
    const material = ebookMaterials.find((m) => m.id === book.id);
    assert.ok(material, "material do catálogo");
    assert.equal(material.cover, book.cover640);
    assert.equal(material.title, book.title);
  }
});

test("os arquivos de capa existem e têm proporção 2:3", async () => {
  for (const book of heroBooks) {
    for (const url of [book.cover640, book.cover320]) {
      const file = join(process.cwd(), "public", url);
      assert.ok(existsSync(file), `faltando ${url}`);
      const meta = await sharp(file).metadata();
      assert.ok(Math.abs(meta.width! / meta.height! - COVER_RATIO) < 0.005, `${url} fora de 2:3`);
    }
  }
});

test("a sequência intercala as quatro disciplinas, começando por Matemática", () => {
  assert.deepEqual(bookSequence(5).map((b) => b.slug), ["matematica", "fisica", "quimica", "biologia", "matematica"]);
});
