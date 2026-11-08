import FormulaLibrary from "../../../../components/operacao/formula-library";
import { formulas, modules } from "../../../../lib/operacao/catalog";
import { operacao } from "../../../../lib/operacao/config";
import { renderRich } from "../../../../lib/operacao/rich";
import { disciplineLabel } from "../../../../lib/operacao/types";

export const metadata = { title: "Fórmulas e conceitos — Operação 2º Domingo" };

export default function FormulasPage() {
  const cards = formulas.map((f) => ({
    id: f.id, discipline: f.discipline, disciplineLabel: disciplineLabel[f.discipline], topic: f.topic, title: f.title,
    texHtml: f.tex ? renderRich(`$$${f.tex}$$`) : undefined, meaning: f.meaning, conditions: f.conditions, example: f.example, commonError: f.commonError, moduleId: f.moduleId,
  }));
  return <FormulaLibrary cards={cards} basePath={operacao.basePath} moduleTitles={Object.fromEntries(modules.map((m) => [m.id, m.title]))} />;
}
