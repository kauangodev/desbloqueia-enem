import QuestionBrowser from "../../../../components/operacao/question-browser";
import { modules, questions, toMeta, topicsFor } from "../../../../lib/operacao/catalog";
import { operacao } from "../../../../lib/operacao/config";
import { parseFilters } from "../../../../lib/operacao/filters";

export const metadata = { title: "Meus erros — Operação 2º Domingo" };

type Params = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? null;

export default async function ErrorsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const titles = Object.fromEntries(modules.map((x) => [x.id, x.title]));
  const filters = parseFilters({ get: (key) => first(params[key]) }, { topics: topicsFor(), modules: Object.keys(titles) });
  return (
    <div className="op-stack">
      <p className="op-card op-note">Seu caderno reúne as questões que você errou ou marcou para revisar depois. Releia a resolução, volte ao módulo e tente de novo: o acerto só conta “de primeira” na primeira tentativa. A seleção fica no endereço da página, então você pode recarregar ou compartilhar.</p>
      <QuestionBrowser questions={questions.map(toMeta)} moduleTitles={titles} basePath={operacao.basePath} view="erros" initialFilters={filters} />
    </div>
  );
}
