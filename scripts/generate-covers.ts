import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { coverSvg, covers, spineSvg } from "../lib/covers";

/** Gera as capas e lombadas da biblioteca 3D em public/books (arquivos locais, leves e versionáveis). */
const dir = join(process.cwd(), "public", "books");
mkdirSync(dir, { recursive: true });
for (const cover of covers) {
  writeFileSync(join(dir, `cover-${cover.id}.svg`), coverSvg(cover) + "\n");
  writeFileSync(join(dir, `spine-${cover.id}.svg`), spineSvg(cover) + "\n");
}
console.log(`${covers.length} capas e ${covers.length} lombadas em public/books`);
