import FormulaLibrary from "../../../../components/operacao/formula-library";
import { modules } from "../../../../lib/operacao/catalog";
import { operacaoUser } from "../../../../lib/operacao/store";
import { formulasFor } from "../../../../lib/planos/scope";
import { operacao } from "../../../../lib/operacao/config";
import { renderRich } from "../../../../lib/operacao/rich";
import { disciplineLabel } from "../../../../lib/operacao/types";

export const metadata = { title: "Fórmulas e conceitos — Matemática e Natureza" };

export default async function FormulasPage() {
  const user = await operacaoUser();
  const cards = (user ? formulasFor(user) : []).map((f) => ({
    id: f.id, discipline: f.discipline, disciplineLabel: disciplineLabel[f.discipline], topic: f.topic, title: f.title,
    texHtml: f.tex ? renderRich(`$$${f.tex}$$`) : undefined, meaning: f.meaning, conditions: f.conditions, example: f.example, commonError: f.commonError, moduleId: f.moduleId,
  }));
  return <FormulaLibrary cards={cards} basePath={operacao.basePath} moduleTitles={Object.fromEntries(modules.map((m) => [m.id, m.title]))} />;
}
