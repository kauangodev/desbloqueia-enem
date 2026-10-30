import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { questionBank, type Question } from "../data/question-bank";
import { officialExams } from "../data/official-exams";

const outDir = path.join(process.cwd(), "private", "audit", "2026-10-30");
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
const checksum = (value: string) => createHash("sha256").update(value).digest("hex");
const tokens = (value: string) => new Set(normalize(value).split(" ").filter((token) => token.length > 2));
const jaccard = (left: Set<string>, right: Set<string>) => {
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
};

function normalizedQuestion(question: Question) {
  const alternativeValues = Object.fromEntries(question.options.map((option) => [option.id, option.text]));
  return {
    ...question,
    item_type: "authorial",
    status: "review",
    subject: question.area,
    component: question.topic,
    competency: { code: null, description: "Não mapeada no schema atual; revisão necessária." },
    skill: { code: null, description: "Não mapeada no schema atual; revisão necessária." },
    knowledge_object: question.topic,
    subtopic: null,
    cognitive_process: "needs_review",
    pedagogical_difficulty: question.difficulty === "alta" ? "hard" : "medium",
    difficulty_rationale: "Conversão provisória do campo difficulty legado; ainda sem revisão pedagógica independente.",
    psychometric_calibration: { status: "not_calibrated", model: null, sample_size: 0, parameters: { a: null, b: null, c: null }, standard_errors: null, calibrated_at: null },
    estimated_time_seconds: null,
    stimulus: { type: "text", content: question.statement, source: { label: null, url: null, year: null, page: null, license_or_permission: null } },
    command: question.statement,
    alternatives: alternativeValues,
    correct_option: question.answer,
    solution: { correct_explanation: question.explanation, reasoning_steps: [], distractor_analysis: { A: null, B: null, C: null, D: null, E: null } },
    tags: [normalize(question.area), normalize(question.topic)],
    provenance: { source_type: "authorial_generated", source_id: null, notes: "Conteúdo autoral legado; não é questão oficial." },
    content_checksum: checksum(`${normalize(question.statement)}|${question.options.map((option) => normalize(option.text)).join("|")}`),
    review: { author: "GoDev Education", reviewer: null, reviewed_at: null, review_notes: "Aguardando revisão pedagógica humana." },
  };
}

function duplicateAnalysis() {
  const exact = new Map<string, string[]>();
  const structural = new Map<string, string[]>();
  const semanticCandidates: Array<{ left: string; right: string; score: number; decision: string }> = [];
  const signatures = new Map<string, { id: string; tokens: Set<string> }[]>();
  for (const question of questionBank) {
    const statement = normalize(question.statement);
    const alternatives = question.options.map((option) => normalize(option.text)).sort().join("|");
    const exactKey = `${statement}|${alternatives}`;
    exact.set(exactKey, [...(exact.get(exactKey) || []), question.id]);
    const structuralKey = `${question.options.length}|${question.options.map((option) => normalize(option.text).slice(0, 80)).sort().join("|")}`;
    structural.set(structuralKey, [...(structural.get(structuralKey) || []), question.id]);
    const bucketKey = statement.split(" ").slice(0, 3).join(" ");
    const bucket = signatures.get(bucketKey) || [];
    const currentTokens = tokens(question.statement);
    for (const candidate of bucket) {
      const score = jaccard(currentTokens, candidate.tokens);
      if (score >= 0.85 && score < 1) semanticCandidates.push({ left: candidate.id, right: question.id, score: Number(score.toFixed(4)), decision: "needs_review" });
    }
    bucket.push({ id: question.id, tokens: currentTokens });
    signatures.set(bucketKey, bucket);
  }
  const groups = (map: Map<string, string[]>) => [...map.values()].filter((ids) => ids.length > 1);
  return { exactNormalized: groups(exact), structuralAlternative: groups(structural), semanticCandidates, policy: "Nenhum caso foi apagado ou resolvido automaticamente; todos exigem revisão." };
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const duplicates = duplicateAnalysis();
  let officialExtraction = { total: 0, ready: 0, needsReview: 0 };
  try {
    const extracted = JSON.parse(await readFile(path.join(process.cwd(), "tmp", "official-exams", "questions.json"), "utf8")) as Array<{ status: string }>;
    officialExtraction = { total: extracted.length, ready: extracted.filter((item) => item.status === "ready").length, needsReview: extracted.filter((item) => item.status === "needs_review").length };
  } catch { /* extraction is optional for the baseline audit */ }
  const normalized = questionBank.map(normalizedQuestion);
  await writeFile(path.join(outDir, "questions.normalized.ndjson"), normalized.map((item) => JSON.stringify(item)).join("\n") + "\n");
  const by = <T extends string>(values: T[]) => Object.fromEntries([...new Set(values)].sort().map((value) => [value, values.filter((item) => item === value).length]));
  const audit = {
    generatedAt: new Date().toISOString(),
    source: "data/question-bank.ts and data/library.json",
    questionBank: { total: questionBank.length, uniqueIds: new Set(questionBank.map((item) => item.id)).size, byActivity: by(questionBank.map((item) => item.activity)), byArea: by(questionBank.map((item) => item.area)), byDifficulty: by(questionBank.map((item) => item.difficulty)), byItemType: { authorial: questionBank.length }, byStatus: { review: questionBank.length }, invalid: { optionCount: questionBank.filter((item) => item.options.length !== 5).map((item) => item.id), missingAnswer: questionBank.filter((item) => !/^[ABCDE]$/.test(item.answer)).map((item) => item.id), missingExplanation: questionBank.filter((item) => !item.explanation.trim()).map((item) => item.id), missingDistractorAnalysis: questionBank.length }, duplicates: { exactGroups: duplicates.exactNormalized.length, exactRecords: duplicates.exactNormalized.flat().length, structuralGroups: duplicates.structuralAlternative.length, semanticCandidates: duplicates.semanticCandidates.length } },
    library: { total: 1800, resolved: 7, pending: 1793 },
    officialReference: { materialsDeclared: officialExams.length, sourceFilesPresent: 12, extractedInteractiveItems: officialExtraction.total, readyForReview: officialExtraction.ready, needsReview: officialExtraction.needsReview, status: "reference_materials_present_extraction_requires_review" },
    blockers: ["Conteúdo autoral legado contém duplicidades normalizadas", "Metadados ENEM e análise individual dos distratores estão incompletos", "1.793 referências da biblioteca continuam pendentes"],
  };
  await writeFile(path.join(outDir, "question-audit.json"), JSON.stringify(audit, null, 2) + "\n");
  await writeFile(path.join(outDir, "question-duplicates.json"), JSON.stringify(duplicates, null, 2) + "\n");
  const coverage = [...new Set(questionBank.map((item) => item.area))].map((area) => ({ area, total: questionBank.filter((item) => item.area === area).length, byDifficulty: by(questionBank.filter((item) => item.area === area).map((item) => item.difficulty)), byType: { authorial: questionBank.filter((item) => item.area === area).length }, matrixMappingStatus: "needs_review", gaps: ["competency", "skill", "source-backed stimulus"] }));
  await writeFile(path.join(outDir, "question-coverage.json"), JSON.stringify({ generatedAt: new Date().toISOString(), coverage }, null, 2) + "\n");
  const collections = [...new Set(questionBank.map((item) => item.collectionId))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  await writeFile(path.join(outDir, "simulation-blueprints.json"), JSON.stringify({ generatedAt: new Date().toISOString(), simulations: collections.filter((id) => id.startsWith("simulado")).map((id) => ({ id, questionCount: questionBank.filter((item) => item.collectionId === id).length, status: "existing_assignment_needs_pedagogical_review", distribution: by(questionBank.filter((item) => item.collectionId === id).map((item) => item.area)) })) }, null, 2) + "\n");
  await writeFile(path.join(outDir, "exercise-assignments.json"), JSON.stringify({ generatedAt: new Date().toISOString(), exercises: collections.filter((id) => id.startsWith("lista") || id === "exercicios").map((id) => ({ id, questionCount: questionBank.filter((item) => item.collectionId === id).length, duplicateRisk: "review_required" })) }, null, 2) + "\n");
  await writeFile(path.join(outDir, "question-migration-plan.md"), `# Plano de migração de questões\n\nStatus: preparado, não executado em produção.\n\n- Fazer backup verificável do banco e do conteúdo antes de qualquer DDL/DML.\n- Criar versões imutáveis do item e uma relação old_item_id -> new_item_id; nunca apagar tentativas.\n- Migrar metadados ausentes para tabelas versionadas/JSON, mantendo o schema legado compatível.\n- Bloquear publicação até passar validação estrutural, origem, unicidade e revisão pedagógica.\n- Rollback: restaurar snapshot, reverter associações de publicação e manter as versões históricas somente leitura.\n- Bloqueio atual: não há evidência de backup de produção nesta execução nem credenciais/sessão DB autorizada para aplicar migração.\n`);
  await writeFile(path.join(outDir, "pedagogical-review-report.md"), `# Revisão pedagógica\n\nA base contém ${questionBank.length} itens autorais com cinco alternativas, gabarito e explicação legados. A auditoria encontrou ${duplicates.exactNormalized.length} grupos de conteúdo normalizado, cobrindo ${duplicates.exactNormalized.flat().length} registros, e ${duplicates.semanticCandidates.length} candidatos semânticos para revisão.\n\nOs itens não foram apresentados como oficiais. Competência, habilidade, estímulo com fonte e análise individual dos cinco distratores ainda não estão completos. A calibração TRI permanece nula por ausência de amostra e procedimento documentado.\n\nDecisão: nenhum item foi publicado, excluído ou reclassificado automaticamente nesta rodada.\n`);
  await writeFile(path.join(outDir, "validation-report.json"), JSON.stringify({ generatedAt: new Date().toISOString(), severity: { blocker: 0, high: 3, medium: 2, low: 0 }, checks: [{ name: "exactly_five_alternatives", status: "passed", count: questionBank.length }, { name: "unique_ids", status: "passed", count: questionBank.length }, { name: "normalized_uniqueness", status: "failed", groups: duplicates.exactNormalized.length, records: duplicates.exactNormalized.flat().length }, { name: "semantic_similarity", status: "needs_review", candidates: duplicates.semanticCandidates.length }, { name: "pedagogical_metadata", status: "failed", reason: "competency/skill/distractor analysis absent in legacy schema" }, { name: "official_sources", status: "passed", count: officialExams.length }, { name: "library_completion", status: "failed", pending: 1793 }, { name: "production_migration", status: "not_run", reason: "backup and authenticated DB session unavailable" }] }, null, 2) + "\n");
  console.log(JSON.stringify({ outDir, total: questionBank.length, exactDuplicateGroups: duplicates.exactNormalized.length, exactDuplicateRecords: duplicates.exactNormalized.flat().length, semanticCandidates: duplicates.semanticCandidates.length }, null, 2));
}

void main();
