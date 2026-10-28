import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const pdfRoot = join(root, "private", "materials");
const coverRoot = join(root, "public", "covers", "enem-2026");
const expected = Array.from({ length: 16 }, (_, index) => String(index + 1).padStart(2, "0"));
const pdfs = readdirSync(pdfRoot).filter((name) => /^ebook-\d{2}-.+-v2\.pdf$/.test(name));
const covers = readdirSync(coverRoot).filter((name) => /^\d{2}-.+\.png$/.test(name));
const failures = [];

for (const order of expected) {
  const pdf = pdfs.find((name) => name.startsWith(`ebook-${order}-`));
  const cover = covers.find((name) => name.startsWith(`${order}-`));
  if (!pdf) failures.push(`PDF ausente: ${order}`);
  if (!cover) failures.push(`Capa ausente: ${order}`);
  if (!pdf) continue;
  try {
    const output = execFileSync("pdfinfo", [join(pdfRoot, pdf)], { encoding: "utf8" });
    const pages = Number(output.match(/^Pages:\s+(\d+)/m)?.[1]);
    if (pages !== 34) failures.push(`${pdf}: esperado 34 páginas, encontrado ${pages || "desconhecido"}`);
  } catch {
    failures.push(`${pdf}: pdfinfo não conseguiu abrir o arquivo`);
  }
}

const result = { expected: 16, pdfs: pdfs.length, covers: covers.length, failures, passed: failures.length === 0 };
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exitCode = 1;
