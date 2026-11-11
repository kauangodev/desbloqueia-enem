// Auditoria estrutural do acervo e das quantidades anunciadas. Uso: node --import tsx scripts/audit-quantidades.ts
import { operacaoQuestions } from "../data/operacao/questions";
import { questions, modules, formulas } from "../lib/operacao/catalog";
import { sessionKinds } from "../lib/operacao/kinds";
import { questionBank } from "../data/question-bank";

type Q = { id: string; statement: string; options: { id: string; text: string }[]; answer: string; resolution?: string; explanation?: string; discipline?: string; figure?: { src: string } };
function structural(name: string, list: Q[]) {
  const issues: string[] = [];
  const ids = new Map<string, number>();
  for (const q of list) {
    ids.set(q.id, (ids.get(q.id) || 0) + 1);
    if (!q.statement || q.statement.trim().length < 10) issues.push(`${q.id}: enunciado vazio/curto`);
    if (!q.options || q.options.length < 4) issues.push(`${q.id}: alternativas insuficientes (${q.options?.length})`);
    const optIds = (q.options || []).map((o) => o.id);
    if (new Set(optIds).size !== optIds.length) issues.push(`${q.id}: ids de alternativa duplicados`);
    if (!optIds.includes(q.answer)) issues.push(`${q.id}: gabarito ${q.answer} não existe nas alternativas`);
    const texts = (q.options || []).map((o) => o.text.trim().toLowerCase());
    if (new Set(texts).size !== texts.length) issues.push(`${q.id}: alternativas com texto repetido`);
    if (q.options?.some((o) => !o.text || !o.text.trim())) issues.push(`${q.id}: alternativa vazia`);
    const res = q.resolution ?? q.explanation;
    if (!res || res.trim().length < 20) issues.push(`${q.id}: resolução ausente/curta`);
  }
  for (const [id, n] of ids) if (n > 1) issues.push(`${id}: id duplicado x${n}`);
  const stm = new Map<string, string[]>();
  for (const q of list) { const k = q.statement.trim().toLowerCase().replace(/\s+/g, " "); stm.set(k, [...(stm.get(k) || []), q.id]); }
  for (const [, v] of stm) if (v.length > 1) issues.push(`enunciado idêntico: ${v.join(", ")}`);
  console.log(`\n[${name}] itens=${list.length} problemas=${issues.length}`);
  issues.slice(0, 40).forEach((i) => console.log("  -", i));
  return issues;
}
structural("operacao (publicados)", questions as unknown as Q[]);
structural("operacao (todos)", operacaoQuestions as unknown as Q[]);
structural("question-bank (banco geral)", questionBank as unknown as Q[]);

const byStatus: Record<string, number> = {};
for (const q of operacaoQuestions) byStatus[q.status] = (byStatus[q.status] || 0) + 1;
console.log("\nOperação por status:", byStatus);
const by = (f: (q: (typeof questions)[number]) => string) => questions.reduce<Record<string, number>>((a, q) => { const k = f(q); a[k] = (a[k] || 0) + 1; return a; }, {});
console.log("por disciplina:", by((q) => q.discipline));
console.log("por origem:", by((q) => q.origin));
console.log("por banco:", by((q) => q.bank || "base"));
console.log("módulos publicados:", modules.length, " fichas:", formulas.length);
console.log("questões com figura:", questions.filter((q) => q.figure).length);
for (const [k, d] of Object.entries(sessionKinds)) console.log(`  ${k}: ${d.group} ${d.per * 2} questões (bank ${d.bank})`);
const gen = (questionBank as unknown as { discipline?: string; area?: string }[]);
console.log("\nbanco geral:", questionBank.length, "itens");
