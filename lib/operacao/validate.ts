import type { FormulaCard, Question, StudyModule } from "./types";

export type Issue = { level: "erro" | "aviso"; where: string; message: string };

const letters = ["A", "B", "C", "D", "E"];
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/** Validadores do acervo. "erro" bloqueia publicação; "aviso" é informativo. */
export function validateCatalog(modules: StudyModule[], questions: Question[], formulas: FormulaCard[], opts: { figureExists?: (src: string) => boolean } = {}): Issue[] {
  const issues: Issue[] = [];
  const push = (level: Issue["level"], where: string, message: string) => issues.push({ level, where, message });
  const dup = (ids: string[], label: string) => { const seen = new Set<string>(); for (const id of ids) { if (seen.has(id)) push("erro", id, `ID duplicado (${label})`); seen.add(id); } };
  dup(modules.map((m) => m.id), "módulo"); dup(questions.map((q) => q.id), "questão"); dup(formulas.map((f) => f.id), "fórmula");
  const moduleIds = new Set(modules.map((m) => m.id));

  for (const m of modules) {
    const w = `módulo ${m.id}`;
    if (!m.concept?.trim() || !m.objective?.trim()) push("erro", w, "módulo vazio ou sem objetivo/conceito");
    if (m.examples.length < 2) push("erro", w, "menos de 2 exemplos resolvidos");
    if (m.recall.length < 3 || m.recall.length > 5) push("erro", w, "revisão ativa deve ter de 3 a 5 perguntas");
    if (!m.commonErrors.length || !m.summary.length) push("erro", w, "faltam erros comuns ou resumo");
    if (!m.sources.length || !m.reviewedAt) push("erro", w, "faltam fontes ou data de revisão");
    // `related` guarda rótulos de tópicos; as questões se ligam ao módulo por `moduleId`.
    if (!questions.some((q) => q.moduleId === m.id)) push("aviso", w, "nenhuma questão vinculada ao módulo");
    for (const r of m.related) if (moduleIds.has(r) === false && !r.trim()) push("erro", w, "referência relacionada vazia");
  }

  const seenText = new Map<string, string>();
  for (const q of questions) {
    const w = `questão ${q.id}`;
    if (q.options.length !== 5 || q.options.some((o, i) => o.id !== letters[i] || !o.text.trim())) push("erro", w, "alternativas A–E ausentes ou vazias");
    if (!letters.includes(q.answer)) push("erro", w, "gabarito inválido");
    if (new Set(q.options.map((o) => norm(o.text))).size !== q.options.length) push("erro", w, "alternativas repetidas (mais de uma poderia estar correta)");
    if (!q.resolution?.trim()) push("erro", w, "resolução vazia");
    if (!q.statement?.trim()) push("erro", w, "enunciado vazio");
    if (q.moduleId && !moduleIds.has(q.moduleId)) push("erro", w, `módulo inexistente: ${q.moduleId}`);
    for (const key of Object.keys(q.distractors)) if (key === q.answer) push("erro", w, "explicação de distrator aponta para a alternativa correta");
    if (q.figure) {
      if (!q.figure.alt?.trim()) push("erro", w, "figura sem texto alternativo");
      if (opts.figureExists && !opts.figureExists(q.figure.src)) push("erro", w, `imagem ausente: ${q.figure.src}`);
    }
    if (q.origin === "oficial") {
      if (!q.official || !q.official.year || !q.official.number || !q.official.caderno || !q.official.sourceUrl) push("erro", w, "metadados oficiais incompletos");
    } else if (q.official) push("erro", w, "questão não oficial com metadados do Inep");
    if (!q.source?.label || !q.source?.reuse) push("erro", w, "fonte/regra de reuso ausente");
    const key = norm(q.statement).slice(0, 160);
    if (seenText.has(key)) push("erro", w, `enunciado repetido de ${seenText.get(key)}`); else seenText.set(key, q.id);
    if (/gabarito|alternativa correta|resposta:/i.test(q.statement)) push("erro", w, "enunciado parece vazar a resposta");
  }

  for (const f of formulas) if (!moduleIds.has(f.moduleId)) push("erro", `fórmula ${f.id}`, `módulo inexistente: ${f.moduleId}`);
  return issues;
}

export type Targets = { modules: number; questions: Record<string, number>; total: number };
export const editorialTargets: Targets = { modules: 32, total: 240, questions: { matematica: 120, fisica: 40, quimica: 40, biologia: 40 } };
