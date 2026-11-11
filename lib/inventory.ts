import { distinctQuestionCount, questionBank } from "../data/question-bank";
import { questions as operacaoQuestions } from "./operacao/catalog";

/**
 * Inventário real do acervo (calculado dos dados, nunca digitado à mão na oferta).
 * "Distintas" = enunciado + alternativas + gabarito diferentes, ignorando a ordem embaralhada das alternativas.
 */
export function inventory() {
  const collections = new Set(questionBank.map((q) => q.collectionId));
  const lists = [...collections].filter((id) => id === "exercicios" || id.startsWith("lista-")).length;
  const sims = [...collections].filter((id) => id.startsWith("simulado-")).length;
  return {
    operacaoQuestions: operacaoQuestions.length,
    generalDistinct: distinctQuestionCount(),
    generalSlots: questionBank.length,
    lists,
    simulados: sims,
  };
}

const inflated = [/2\.100 quest/i, /30 simulados com 600/i, /60 listas de exerc[ií]cios com 1\.500/i];

/**
 * Substitui as três linhas de quantidade do banco geral pelas quantidades reais.
 * O texto vem do banco de dados em produção; este ajuste garante que a vitrine mostre apenas o que existe.
 */
export function accurateFeatures(features: string[]) {
  const inv = inventory();
  const accurate = [
    `Operação 2º Domingo: ${inv.operacaoQuestions} questões comentadas de Matemática e Ciências da Natureza`,
    `Banco geral com ${inv.generalDistinct} questões distintas das quatro áreas, em ${inv.lists} listas e ${inv.simulados} simulados (as questões se repetem entre coleções)`,
  ];
  const out: string[] = [];
  let inserted = false;
  for (const feature of features) {
    if (inflated.some((pattern) => pattern.test(feature))) {
      if (!inserted) { out.push(...accurate); inserted = true; }
      continue;
    }
    out.push(feature);
  }
  return out;
}
