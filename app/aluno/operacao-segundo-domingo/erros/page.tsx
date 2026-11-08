import QuestionBrowser from "../../../../components/operacao/question-browser";
import { modules, questions, toMeta } from "../../../../lib/operacao/catalog";
import { operacao } from "../../../../lib/operacao/config";

export const metadata = { title: "Meus erros — Operação 2º Domingo" };

export default function ErrorsPage() {
  const titles = Object.fromEntries(modules.map((x) => [x.id, x.title]));
  return (
    <div className="op-stack">
      <p className="op-card op-note">Seu caderno reúne as questões que você errou ou marcou para revisar depois. Releia a resolução, volte ao módulo e tente de novo: o acerto só conta “de primeira” na primeira tentativa.</p>
      <QuestionBrowser questions={questions.map(toMeta)} moduleTitles={titles} basePath={operacao.basePath} view="erros" />
    </div>
  );
}
