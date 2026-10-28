import { readFileSync } from "node:fs";
import { questionBank } from "../data/question-bank";

const library = JSON.parse(readFileSync("data/library.json", "utf8")) as Array<{
  estado_resolucao?: string;
}>;
const activities = ["exercicios", "simulado-1", "simulado-2"] as const;
const ids = questionBank.map((question) => question.id);
const normalizeContent = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const contentKey = (question: (typeof questionBank)[number]) => [normalizeContent(question.statement), ...question.options.map((option) => normalizeContent(option.text)).sort()].join("|");
const duplicateContentGroups = [...questionBank.reduce((groups, question) => { const key = contentKey(question); const group = groups.get(key) || []; group.push(question.id); groups.set(key, group); return groups; }, new Map<string, string[]>()).values()].filter((group) => group.length > 1);
const invalid = questionBank.filter(
  (question) =>
    question.options.length !== 5 ||
    new Set(question.options.map((option) => option.text)).size !== 5 ||
    !question.options.some((option) => option.id === question.answer) ||
    !question.statement.trim() ||
    !question.explanation.trim() ||
    !question.nextStep.trim(),
);
const collectionCounts = Object.fromEntries(
  [...new Set(questionBank.map((question) => question.collectionId))].map((collectionId) => [
    collectionId,
    questionBank.filter((question) => question.collectionId === collectionId).length,
  ]),
);
const batchCounts = Object.fromEntries(
  [...new Set(questionBank.map((question) => question.batchId))]
    .sort((a, b) => a - b)
    .map((batchId) => [batchId, questionBank.filter((question) => question.batchId === batchId).length]),
);
const pedagogicalInvalid = questionBank.filter(
  (question) =>
    question.statement.trim().length < 10 ||
    question.explanation.trim().length < 10 ||
    question.nextStep.trim().length < 10 ||
    !["Linguagens", "Ciências Humanas", "Ciências da Natureza", "Matemática"].includes(question.area) ||
    !question.topic.trim() ||
    !question.sourceLabel.startsWith("Autoral"),
);
const invalidBatchIds = Object.entries(batchCounts)
  .filter(([, count]) => count !== 100)
  .map(([batchId]) => Number(batchId));

console.log(
  JSON.stringify(
    {
      questionBank: {
        total: questionBank.length,
        byActivity: Object.fromEntries(
          activities.map((activity) => [
            activity,
            questionBank.filter((question) => question.activity === activity).length,
          ]),
        ),
        uniqueIds: new Set(ids).size,
        duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
        normalizedContentGroups: duplicateContentGroups.length,
        normalizedDuplicateRecords: duplicateContentGroups.reduce((total, group) => total + group.length - 1, 0),
        normalizedDuplicateExamples: duplicateContentGroups.slice(0, 10),
        invalidRecords: invalid.map((question) => question.id),
        sourceLabels: [...new Set(questionBank.map((question) => question.sourceLabel))],
        collections: collectionCounts,
        batches: batchCounts,
        pedagogicalGate: {
          passed: pedagogicalInvalid.length === 0 && invalidBatchIds.length === 0 && Object.keys(batchCounts).length === 21,
          invalidRecords: pedagogicalInvalid.map((question) => question.id),
          invalidBatchIds,
        },
      },
      library: {
        total: library.length,
        resolved: library.filter(
          (item) => item.estado_resolucao === "EXPLICADA E CONFERIDA",
        ).length,
        pending: library.filter((item) =>
          String(item.estado_resolucao || "").startsWith("PENDENTE"),
        ).length,
      },
      target: {
        simulados: {
          required: 30,
          current: new Set(
            questionBank
              .filter((question) => question.collectionId.startsWith("simulado"))
              .map((question) => question.collectionId),
          ).size,
        },
        exercises: {
          requiredLists: 60,
          requiredQuestions: 1500,
          currentLists: new Set(questionBank.filter((question) => question.activity === "exercicios").map((question) => question.collectionId)).size,
          currentQuestions: questionBank.filter((question) => question.activity === "exercicios").length,
        },
        completeQuestions: { required: 2100, current: questionBank.length },
      },
    },
    null,
    2,
  ),
);
// A contagem bruta não é suficiente: uma questão repetida em outra coleção
// não representa conteúdo único. O gate de homologação precisa falhar até
// que cada identidade normalizada tenha sido revisada, substituída ou
// explicitamente arquivada fora do acervo publicado.
const uniqueContentGatePassed = duplicateContentGroups.length === 0;
if (
  invalid.length ||
  pedagogicalInvalid.length ||
  invalidBatchIds.length ||
  Object.keys(batchCounts).length !== 21 ||
  !uniqueContentGatePassed
) process.exitCode = 1;

