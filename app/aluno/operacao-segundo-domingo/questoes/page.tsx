import QuestionBrowser from "../../../../components/operacao/question-browser";
import { modules, questions, toPublic } from "../../../../lib/operacao/catalog";
import { operacao } from "../../../../lib/operacao/config";

export const metadata = { title: "Questões — Operação 2º Domingo" };

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const titles = Object.fromEntries(modules.map((x) => [x.id, x.title]));
  return <QuestionBrowser questions={questions.map(toPublic)} moduleTitles={titles} basePath={operacao.basePath} view="questoes" initialModule={m && titles[m] ? m : undefined} />;
}
