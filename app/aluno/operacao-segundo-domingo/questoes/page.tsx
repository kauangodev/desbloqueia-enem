import QuestionBrowser from "../../../../components/operacao/question-browser";
import { modules, questions, toMeta, topicsFor } from "../../../../lib/operacao/catalog";
import { operacao } from "../../../../lib/operacao/config";
import { parseFilters } from "../../../../lib/operacao/filters";

export const metadata = { title: "Questões — Operação 2º Domingo" };

type Params = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? null;

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const titles = Object.fromEntries(modules.map((x) => [x.id, x.title]));
  // `m` já era usado por links existentes ("Ver questões deste módulo"): continua valendo.
  const filters = parseFilters({ get: (key) => first(params[key]) }, { topics: topicsFor(), modules: Object.keys(titles) });
  return <QuestionBrowser questions={questions.map(toMeta)} moduleTitles={titles} basePath={operacao.basePath} view="questoes" initialFilters={filters} />;
}
