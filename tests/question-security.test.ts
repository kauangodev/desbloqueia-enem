import assert from "node:assert/strict";
import test from "node:test";
import { questionBank, toPublicQuestion } from "../data/question-bank";

test("projeção pública não transporta gabarito nem resolução antes da submissão", () => {
  const publicQuestion = toPublicQuestion(questionBank[0]);
  assert.equal("answer" in publicQuestion, false);
  assert.equal("explanation" in publicQuestion, false);
  assert.equal("nextStep" in publicQuestion, false);
  assert.equal(publicQuestion.options.length, 5);
  assert.equal(publicQuestion.statement, questionBank[0].statement);
});

test("cada coleção mantém IDs únicos dentro da atividade", () => {
  for (const collectionId of new Set(questionBank.map((question) => question.collectionId))) {
    const ids = questionBank.filter((question) => question.collectionId === collectionId).map((question) => question.id);
    assert.equal(new Set(ids).size, ids.length, collectionId);
  }
});
