import { readFileSync } from "node:fs";
import { questionBank } from "../data/question-bank";

const library = JSON.parse(readFileSync("data/library.json", "utf8")) as Array<{
  estado_resolucao?: string;
}>;
const activities = ["exercicios", "simulado-1", "simulado-2"] as const;
const ids = questionBank.map((question) => question.id);
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
        invalidRecords: invalid.map((question) => question.id),
        sourceLabels: [...new Set(questionBank.map((question) => question.sourceLabel))],
        collections: collectionCounts,
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

