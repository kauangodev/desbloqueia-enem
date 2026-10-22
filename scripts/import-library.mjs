import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const source = process.argv[2];
if (!source) throw new Error("Informe o caminho do HTML original.");
const html = readFileSync(source, "utf8");
const match = html.match(/const ALL=(\[.*?\]);let page=/s);
if (!match) throw new Error("Estrutura do arquivo não reconhecida.");
const entries = JSON.parse(match[1]);
if (entries.length !== 1800 || new Set(entries.map((e) => e.id)).size !== 1800)
  throw new Error("Índice inválido.");
mkdirSync("data", { recursive: true });
writeFileSync("data/library.json", JSON.stringify(entries));
console.log(
  JSON.stringify({
    entries: entries.length,
    solutions: entries.filter((e) => e.resolucao_autoral).length,
    years: [...new Set(entries.map((e) => e.ano))],
  }),
);
