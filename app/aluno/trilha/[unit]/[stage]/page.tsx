import Link from "next/link";
import { notFound } from "next/navigation";
import "katex/dist/katex.min.css";
import StagePlayer from "../../../../../components/trilha/stage-player";
import { operacao } from "../../../../../lib/operacao/config";
import { operacaoUser } from "../../../../../lib/operacao/store";
import { STAGE_LABEL } from "../../../../../lib/trilha/model";
import { unitById } from "../../../../../lib/trilha/service";

export const dynamic = "force-dynamic";
const stages = ["pratica", "desafio", "teste", "revisao"] as const;

export async function generateMetadata({ params }: { params: Promise<{ unit: string; stage: string }> }) {
  const { unit, stage } = await params;
  const u = unitById(unit);
  return { title: u ? `${STAGE_LABEL[stage as (typeof stages)[number]] ?? "Etapa"} — ${u.title} | GoDev Education` : "Trilha ENEM | GoDev Education" };
}

export default async function StagePage({ params }: { params: Promise<{ unit: string; stage: string }> }) {
  const { unit: unitId, stage } = await params;
  const unit = unitById(unitId);
  if (!unit || !(stages as readonly string[]).includes(stage)) notFound();
  const user = await operacaoUser();
  if (!user) return <div className="as-page"><section className="as-empty"><h1>Trilha ENEM</h1><p className="as-muted">A trilha faz parte do seu plano.</p><Link className="as-btn as-btn-primary" href="/aluno/planos">Ver planos</Link></section></div>;
  const typed = stage as (typeof stages)[number];
  return (
    <div className="as-page tr-page">
      <nav aria-label="Você está em" className="op-crumb"><Link href="/aluno/trilha">Trilha ENEM</Link><span aria-hidden="true"> / </span><Link href={`/aluno/trilha/${unit.id}`}>{unit.title}</Link><span aria-hidden="true"> / </span><span aria-current="page">{STAGE_LABEL[typed]}</span></nav>
      <h1 className="op-sr">{STAGE_LABEL[typed]}: {unit.title}</h1>
      <StagePlayer
        unitId={unit.id}
        stage={typed}
        unitTitle={unit.title}
        unitHref={`/aluno/trilha/${unit.id}`}
        moduleHref={`${operacao.basePath}/materiais/${unit.moduleId}`}
        trilhaHref={`/aluno/trilha?a=${unit.area}`}
        errosHref={`${operacao.basePath}/erros?s=erradas&m=${unit.moduleId}`}
      />
    </div>
  );
}
