import assert from "node:assert/strict";
import test from "node:test";
import { plans } from "../lib/config";
import { accurateFeatures, inventory } from "../lib/inventory";
import { questionBank, questionsForCollection } from "../data/question-bank";

test("quantidades anunciadas no plano Premium batem com o acervo real", () => {
  const inv = inventory();
  const premium = plans.find((p) => p.id === "premium")!.features.join(" | ");
  assert.ok(premium.includes(`${inv.operacaoQuestions} questões comentadas`), "Operação");
  assert.ok(premium.includes(`${inv.generalDistinct} questões distintas`), "banco geral");
  assert.ok(premium.includes(`${inv.lists} listas`) && premium.includes(`${inv.simulados} simulados`), "listas/simulados");
  assert.ok(!/2\.100|1\.500 quest|600 quest.*simulados/.test(premium.replace(String(inv.operacaoQuestions), "")), "sem números inflados");
});

test("texto de vitrine vindo do banco com quantidades antigas é corrigido", () => {
  const out = accurateFeatures(["Tudo do Essencial", "2.100 questões autorais no estilo ENEM", "30 simulados com 600 questões", "60 listas de exercícios com 1.500 questões", "E-book de Redação"]);
  assert.equal(out.length, 4);
  assert.ok(out.every((f) => !/2\.100|1\.500/.test(f)));
});

test("nenhuma coleção repete a mesma questão", () => {
  const ids = new Set(questionBank.map((q) => q.collectionId));
  for (const id of ids) {
    const list = questionsForCollection(id);
    const keys = new Set(list.map((q) => q.statement.trim().toLowerCase()));
    assert.equal(keys.size, list.length, id);
  }
});

test("média ponderada (aut-192) tem o gabarito coerente com a resolução (7,3)", () => {
  const copies = questionBank.filter((q) => q.statement.startsWith("Uma nota 6 tem peso 1 e uma nota 8 tem peso 2"));
  assert.ok(copies.length > 0);
  for (const q of copies) assert.equal(q.options.find((o) => o.id === q.answer)?.text.trim(), "7,3", q.id);
});

test("Essencial: a linha de 40 exercícios é trocada pela entrega real", () => {
  const inv = inventory();
  const essencial = plans.find((p) => p.id === "essencial")!.features.join(" | ");
  assert.ok(essencial.includes(`${inv.operacaoQuestions} questões`), "config do Essencial cita a Operação");
  const out = accurateFeatures(["40 exercícios comentados para fixação", "Cronograma e mapa da revisão"]);
  assert.ok(out[0].includes(`${inv.operacaoQuestions} questões`) && !/^40 /.test(out[0]));
});
