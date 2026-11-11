// Verificação aritmética independente das resoluções: extrai cadeias "a = b = c" dentro de $...$ e confere numericamente.
// Não substitui a leitura pedagógica: só pega erro de conta dentro da própria resolução. Uso: node --import tsx scripts/audit-aritmetica.ts
import { questions } from "../lib/operacao/catalog";
import { questionBank } from "../data/question-bank";

function toJs(src: string): string | null {
  let s = src;
  s = s.replace(/\\left|\\right|\\!|\\,|\\;|\\ |\\quad|~/g, "").replace(/\\text\{[^}]*\}|\\mathrm\{[^}]*\}|\\%|%/g, "").replace(/R\\\$/g, "");
  s = s.replace(/\\dfrac|\\tfrac/g, "\\frac");
  for (let i = 0; i < 4; i++) s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "(($1)/($2))");
  s = s.replace(/\\sqrt\{([^{}]*)\}/g, "Math.sqrt($1)").replace(/\\cdot|\\times/g, "*").replace(/\\div/g, "/");
  s = s.replace(/(\d)\{,\}(\d)/g, "$1.$2").replace(/(\d),(\d)/g, "$1.$2");
  s = s.replace(/(\d)\s+(?=\d{3}\b)/g, "$1").replace(/\^\{([^{}]*)\}/g, "**($1)").replace(/\^(\d+)/g, "**$1");
  s = s.replace(/[{}]/g, (m) => (m === "{" ? "(" : ")")).replace(/−|–/g, "-");
  s = s.replace(/(\d)\(/g, "$1*(").replace(/\)(\d)/g, ")*$1").replace(/\)\(/g, ")*(");
  if (/[^0-9+\-*/().\sMathsqrt*]/.test(s.replace(/Math\.sqrt/g, ""))) return null;
  if (!/\d/.test(s)) return null;
  return s;
}
const ev = (js: string) => { try { const v = Function(`"use strict"; return (${js});`)(); return typeof v === "number" && isFinite(v) ? v : null; } catch { return null; } };

type Item = { id: string; resolution: string };
function check(list: Item[], label: string) {
  const bad: string[] = []; let chains = 0;
  for (const q of list) {
    const maths = [...q.resolution.matchAll(/\$([^$]+)\$/g)].map((m) => m[1]);
    for (const m of maths) {
      if (!m.includes("=") || /\\Rightarrow|\\approx|\\ge|\\le|<|>|\\neq/.test(m)) continue;
      const parts = m.split("=").map((p) => p.trim()).filter(Boolean);
      const vals = parts.map((p) => { const js = toJs(p); return js ? ev(js) : null; });
      const known = vals.filter((v): v is number => v !== null);
      if (known.length < 2 || known.length !== vals.length) continue;
      chains++;
      const base = known[known.length - 1];
      if (known.some((v) => Math.abs(v - base) > 1e-6 * Math.max(1, Math.abs(base)) + 0.006)) bad.push(`${q.id}: $${m}$ → ${known.map((v) => +v.toFixed(4)).join(" | ")}`);
    }
  }
  console.log(`\n[${label}] itens=${list.length} cadeias verificáveis=${chains} divergências=${bad.length}`);
  bad.slice(0, 60).forEach((b) => console.log(" -", b));
}
check(questions as unknown as Item[], "Operação (600)");
check((questionBank as unknown as { id: string; explanation: string }[]).map((q) => ({ id: q.id, resolution: q.explanation })), "Banco geral (2100 posições)");
