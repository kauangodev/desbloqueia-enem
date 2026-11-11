// Heurística de coerência resolução × gabarito: o texto da alternativa correta (ou seu valor numérico) deve aparecer na resolução.
// Não substitui revisão pedagógica: apenas lista itens suspeitos para leitura humana.
import { questions } from "../lib/operacao/catalog";
const strip = (s: string) => s.replace(/\$|\,|\;|\!|\text\{([^}]*)\}|\mathrm\{([^}]*)\}|\%|[\s{}]/g, (m, a, b) => a ?? b ?? "").replace(/[−–]/g, "-").replace(/,/g, ".").toLowerCase();
const nums = (s: string) => (s.replace(/[−–]/g, "-").replace(/(\d)\s(?=\d{3}\b)/g, "$1").match(/-?\d+(?:[.,]\d+)?/g) || []).map((n) => n.replace(",", "."));
const flagged: string[] = [];
for (const q of questions) {
  const correct = q.options.find((o) => o.id === q.answer)!.text;
  const res = q.resolution;
  const cn = nums(correct), rn = new Set(nums(res));
  const okText = strip(res).includes(strip(correct)) || res.toLowerCase().includes(correct.toLowerCase());
  const okNum = cn.length > 0 && cn.every((n) => rn.has(n));
  const letter = new RegExp(`alternativa\s*${q.answer}\b|\(${q.answer}\)|letra\s*${q.answer}\b`, "i").test(res);
  if (!(okText || okNum || letter)) flagged.push(`${q.id} [${q.discipline}] resp ${q.answer}=${correct.slice(0, 40)} | RES: ${res.slice(0, 120).replace(/\n/g, " ")}`);
}
console.log(`itens=${questions.length} sem correspondência textual/numérica=${flagged.length}`);
flagged.forEach((f) => console.log(" -", f));
const dist: Record<string, number> = {}; questions.forEach((q) => (dist[q.answer] = (dist[q.answer] || 0) + 1)); console.log("distribuição do gabarito:", dist);
