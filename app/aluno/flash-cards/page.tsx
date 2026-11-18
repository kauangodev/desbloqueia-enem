import Link from "next/link";
import "katex/dist/katex.min.css";
import FlashDeck from "../../../components/aluno/flash-deck";
import { formulas, modules } from "../../../lib/operacao/catalog";
import { operacao, todayInSaoPaulo } from "../../../lib/operacao/config";
import { renderRich } from "../../../lib/operacao/rich";
import { operacaoUser } from "../../../lib/operacao/store";
import { disciplineLabel } from "../../../lib/operacao/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Flash cards | GoDev Education" };

export default async function FlashCardsPage() {
  const user = await operacaoUser();
  if (!user) {
    return (
      <div className="as-page">
        <header className="as-head"><div><h1>Flash cards</h1><p>Fichas de fórmulas com revisão espaçada.</p></div></header>
        <section className="as-empty"><h2>Os flash cards fazem parte do seu plano</h2><Link className="as-btn as-btn-primary" href="/aluno/planos">Ver planos</Link></section>
      </div>
    );
  }
  const titles = Object.fromEntries(modules.map((m) => [m.id, m.title]));
  const cards = formulas.map((f) => ({
    id: f.id, disciplineLabel: disciplineLabel[f.discipline], topic: f.topic, title: f.title,
    texHtml: f.tex ? renderRich(`$$${f.tex}$$`) : undefined, meaning: f.meaning, conditions: f.conditions, example: f.example, commonError: f.commonError,
    moduleId: f.moduleId, moduleTitle: titles[f.moduleId] || "",
  }));
  return (
    <div className="as-page">
      <header className="as-head"><div><h1>Flash cards</h1><p>Revise as fichas de fórmulas um pouco por dia. O que você erra volta amanhã; o que acerta volta cada vez mais tarde.</p></div><Link className="as-btn" href={`${operacao.basePath}/formulas`}>Ver todas as fórmulas</Link></header>
      <FlashDeck cards={cards} today={todayInSaoPaulo()} basePath={operacao.basePath} />
    </div>
  );
}
