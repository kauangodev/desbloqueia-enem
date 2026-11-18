import Link from "next/link";
import { notFound } from "next/navigation";
import FundamentoButton from "../../../../components/trilha/fundamento-button";
import { operacao, todayInSaoPaulo } from "../../../../lib/operacao/config";
import { operacaoUser } from "../../../../lib/operacao/store";
import { AREAS, CHALLENGE_ITEMS, passThreshold, STAGE_LABEL, type StageKind } from "../../../../lib/trilha/model";
import { unitById, unitView } from "../../../../lib/trilha/service";

export const dynamic = "force-dynamic";

const describe: Record<StageKind, string> = {
  fundamento: "Leia o conceito e o exemplo resolvido da unidade e marque como visto.",
  pratica: "4 questões com correção e raciocínio a cada resposta.",
  desafio: `${CHALLENGE_ITEMS} questões estilo Enem. Meta: ${passThreshold(CHALLENGE_ITEMS)} de ${CHALLENGE_ITEMS}. A correção vem na entrega.`,
  teste: "Já conhece o tema? 5 questões validam a unidade sem refazer os fundamentos.",
  revisao: "3 questões, agendadas em 1, 3 e 7 dias depois de dominar a unidade.",
};

export async function generateMetadata({ params }: { params: Promise<{ unit: string }> }) {
  const unit = unitById((await params).unit);
  return { title: unit ? `${unit.title} — Trilha ENEM | GoDev Education` : "Trilha ENEM | GoDev Education" };
}

export default async function UnitPage({ params }: { params: Promise<{ unit: string }> }) {
  const { unit: unitId } = await params;
  if (!unitById(unitId)) notFound();
  const user = await operacaoUser();
  if (!user) return <div className="as-page"><section className="as-empty"><h1>Trilha ENEM</h1><p className="as-muted">A trilha faz parte do seu plano.</p><Link className="as-btn as-btn-primary" href="/aluno/planos">Ver planos</Link></section></div>;
  let view: Awaited<ReturnType<typeof unitView>> | null = null;
  try { view = await unitView(user.kv, unitId, todayInSaoPaulo()); } catch { view = null; }
  if (!view) return <div className="as-page"><p className="op-error" role="alert">Não foi possível carregar esta unidade agora. Seu progresso está salvo; tente recarregar.</p></div>;
  const { unit, state, mastery, status, stages, active, prefs } = view;
  const areaLabel = AREAS.find((a) => a.id === unit.area)?.label ?? "";
  const moduleHref = `${operacao.basePath}/materiais/${unit.moduleId}`;
  const stageHref = (stage: StageKind) => `/aluno/trilha/${unit.id}/${stage}`;
  const best = state.desafio.tries.length ? Math.max(...state.desafio.tries.map((t) => t.correct)) : null;

  return (
    <div className="as-page tr-page">
      <nav aria-label="Você está em" className="op-crumb"><Link href="/aluno/trilha">Trilha ENEM</Link><span aria-hidden="true"> / </span><Link href={`/aluno/trilha?a=${unit.area}`}>{areaLabel}</Link><span aria-hidden="true"> / </span><span aria-current="page">{unit.title}</span></nav>
      <header className="as-head">
        <div><h1>{unit.title}</h1><p>{unit.objective}</p></div>
        <span className={`tr-pill is-${status.state}`}>{status.state === "bloqueada" ? "Bloqueada" : status.state === "validada" ? "Dominada pelo teste" : status.state === "concluida" ? "Concluída" : status.state === "em-andamento" ? "Em andamento" : "Disponível"}</span>
      </header>

      {status.state === "bloqueada" ? (
        <p className="op-note" role="note">Bloqueio pedagógico: conclua antes {status.missing.map((m, i) => <span key={m.id}>{i ? ", " : ""}<Link className="op-link" href={`/aluno/trilha/${m.id}`}>{m.title}</Link></span>)}. {prefs.modo === "aprender" ? "Se você já conhece o tema, o teste de avanço valida esta unidade." : "No modo Treinar, prática e desafio continuam abertos."}</p>
      ) : null}
      {status.reviewDue ? <p className="op-note" role="note">Revisão vencida: uma revisão curta fixa o que você já domina. <Link className="op-link" href={stageHref("revisao")}>Revisar agora</Link></p> : null}
      {unit.coverage === "limitada" ? <p className="tr-note">Cobertura limitada: esta unidade tem {unit.pool.length} questões publicadas. Nas novas tentativas, algumas podem se repetir.</p> : null}

      <ol className="tr-steps" aria-label="Etapas da unidade">
        {stages.map((s) => {
          const done = s.stage === "fundamento" ? Boolean(state.fundamentoAt) : s.stage === "pratica" ? Boolean(state.pratica) : s.stage === "desafio" ? Boolean(state.desafio.passedAt) : s.stage === "teste" ? Boolean(state.teste.passedAt) : state.revisao?.due === null;
          const running = active[s.stage as Exclude<StageKind, "fundamento">];
          return (
            <li key={s.stage} className={`tr-step${done ? " is-done" : ""}${!s.ok && !done ? " is-locked" : ""}`}>
              <div className="tr-step-body">
                <h2>{s.label}{done ? <span className="tr-tick"> · feita</span> : null}</h2>
                <p>{describe[s.stage]}</p>
                {s.stage === "desafio" && best !== null ? <p className="tr-note">Melhor resultado: {best} de {state.desafio.tries[0].total} em {state.desafio.tries.length} {state.desafio.tries.length === 1 ? "tentativa" : "tentativas"}.</p> : null}
                {s.stage === "pratica" && state.pratica ? <p className="tr-note">Última prática: {state.pratica.correct} de {state.pratica.total} certas.</p> : null}
                {s.stage === "revisao" && state.revisao ? <p className="tr-note">{state.revisao.due ? `Próxima revisão: ${state.revisao.due.split("-").reverse().join("/")}.` : "Ciclo de revisões concluído: domínio mantido."}</p> : null}
                {!s.ok && s.reason ? <p className="tr-lock">{s.reason}</p> : null}
                {running ? <p className="tr-note">Em andamento: {running.answered} de {running.total} respondidas. Suas respostas estão salvas.</p> : null}
              </div>
              <div className="tr-step-act">
                {s.stage === "fundamento" ? (
                  <>
                    {s.ok ? <Link className="as-btn" href={moduleHref}>Ler o conteúdo</Link> : null}
                    {s.ok ? <FundamentoButton unitId={unit.id} done={Boolean(state.fundamentoAt)} /> : null}
                  </>
                ) : s.ok ? (
                  <Link className={`as-btn${!done && !s.items ? "" : ""}`} href={stageHref(s.stage)}>{running ? "Retomar" : done ? "Refazer" : "Começar"} {s.items ? `(${s.items} questões)` : ""}</Link>
                ) : <span className="tr-blocked">Indisponível</span>}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="tr-note">Estado do domínio: {mastery === "validada" ? "validado pelo teste de avanço" : mastery === "concluida" ? "concluído por estudo (fundamento, prática e desafio)" : mastery === "em-andamento" ? "em andamento" : "ainda não iniciado"}. Concluir por estudo e validar pelo teste são registros diferentes.</p>
    </div>
  );
}
