import { existsSync } from "node:fs";
import path from "node:path";
import { formulaCards } from "../data/operacao/formulas";
import { allModules as operacaoModules } from "../lib/operacao/catalog";
import { operacaoQuestions } from "../data/operacao/questions";
import { editorialTargets, validateCatalog } from "../lib/operacao/validate";

const issues = validateCatalog(operacaoModules, operacaoQuestions, formulaCards, { figureExists: (src) => existsSync(path.join(process.cwd(), "public", src.replace(/^\//, ""))) });
const count = (d: string) => operacaoQuestions.filter((q) => q.discipline === d && q.status === "publicado").length;
const modulesBy = (d: string) => operacaoModules.filter((m) => m.discipline === d && m.status === "publicado").length;
const origin = (o: string) => operacaoQuestions.filter((q) => q.origin === o).length;

console.log("Operação 2º Domingo — acervo publicado");
for (const d of ["matematica", "fisica", "quimica", "biologia"]) console.log(`  ${d.padEnd(11)} módulos ${modulesBy(d)} | questões ${count(d)} / meta ${editorialTargets.questions[d]}`);
console.log(`  módulos ${operacaoModules.filter((m) => m.status === "publicado").length} / meta ${editorialTargets.modules}`);
console.log(`  questões ${operacaoQuestions.length} / meta ${editorialTargets.total} (oficiais ${origin("oficial")}, autorais ${origin("autoral")}, adaptadas ${origin("adaptada")})`);
console.log(`  fórmulas ${formulaCards.length}`);
const errors = issues.filter((i) => i.level === "erro");
for (const i of issues) console.log(`  [${i.level}] ${i.where}: ${i.message}`);
if (operacaoModules.filter((m) => m.status === "publicado").length < editorialTargets.modules || operacaoQuestions.length < editorialTargets.total) console.log("  META EDITORIAL NÃO ATINGIDA (ver números acima).");
if (errors.length) { console.error(`\n${errors.length} erro(s) de validação.`); process.exit(1); }
console.log("\nSem erros de integridade.");
