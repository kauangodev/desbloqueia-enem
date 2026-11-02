import { mkdir, readdir, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import sharp from "sharp";

const sourceDir = join(process.cwd(), "public", "covers", "enem-2026");
const outputDir = join(sourceDir, "optimized");
const widths = [320, 640, 960];

await mkdir(outputDir, { recursive: true });

const sources = (await readdir(sourceDir))
  .filter((file) => /^\d{2}-.+\.png$/i.test(file))
  .sort();

if (sources.length === 0) {
  throw new Error(`Nenhuma capa PNG encontrada em ${sourceDir}`);
}

for (const source of sources) {
  const stem = basename(source, ".png");
  for (const width of widths) {
    const destination = join(outputDir, `${stem}-${width}.webp`);
    await sharp(join(sourceDir, source))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78, effort: 6 })
      .toFile(destination);

    const { size } = await stat(destination);
    if (width === 320 && size >= 200_000) {
      throw new Error(`${destination} excede 200 KB (${size} bytes)`);
    }
  }
}

console.log(`Otimizadas ${sources.length} capas em ${outputDir}`);
