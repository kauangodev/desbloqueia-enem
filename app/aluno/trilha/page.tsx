import Link from "next/link";
import { Icon } from "../../../components/icons";
import PrefsForm from "../../../components/trilha/prefs-form";
import { operacao, todayInSaoPaulo } from "../../../lib/operacao/config";
import { operacaoUser } from "../../../lib/operacao/store";
import { disciplineLabel, type Discipline } from "../../../lib/operacao/types";
import { AREAS, areaProgress, currentUnit, masteryOf, STAGE_LABEL, unitStatus, type Area, type Unit, type UnitState } from "../../../lib/trilha/model";
import { loadOverview } from "../../../lib/trilha/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Trilha ENEM | GoDev Education" };

const statusText = { bloqueada: "Bloqueada", disponivel: "Disponível", "em-andamento": "Em andamento", concluida: "Concluída", validada: "Dominada pelo teste" } as const;
const verb = { bloqueada: "Ver unidade", disponivel: "Começar", "em-andamento": "Continuar", concluida: "Rever", validada: "Rever" } as const;

function Marker({ state }: { state: keyof typeof statusText }) {
  const icon = state === "bloqueada" ? "lock" : state === "validada" ? "star" : state === "concluida" ? "check" : state === "em-andamento" ? "timer" : "target";
  return <span className={`tr-marker is-${state}`} aria-hidden="true"><Icon name={icon} size={16} /></span>;
}

export default async function TrilhaPage({ searchParams }: { searchParams?: Promise<{ a?: string }> }) {
  const requested = (await searchParams)?.a;
  const user = await operacaoUser();
  if (!user) {
    return (
      <div className="as-page">
        <header className="as-head"><div><h1>Trilha ENEM</h1><p>Unidades com fundamento, prática e desafio, no seu ritmo.</p></div></header>
        <section className="as-empty"><h2>A trilha faz parte do seu plano</h2><p className="as-muted">Ative um plano para abrir a trilha. Se você já pagou, fale com o atendimento.</p><Link className="as-btn as-btn-primary" href="/aluno/planos">Ver planos</Link></section>
      </div>
    );
  }
  const today = todayInSaoPaulo();
  let overview: Awaited<ReturnType<typeof loadOverview>> | null = null;
  try { overview = await loadOverview(user.kv); } catch { overview = null; }
  if (!overview) {
    return (
      <div className="as-page">
        <header className="as-head"><div><h1>Trilha ENEM</h1></div></header>
        <p className="op-error" role="alert">Não foi possível carregar a sua trilha agora. Seu progresso está salvo; tente recarregar a página.</p>
      </div>
    );
  }
  const { units, states, prefs } = overview;
  const rec = currentUnit(units, states, prefs.modo, today);
  const area: Area = AREAS.find((a) => a.id === requested)?.id ?? rec?.unit.area ?? "matematica";
  const areaInfo = AREAS.find((a) => a.id === area)!;
  const list = units.filter((u) => u.area === area);
  const groups = areaInfo.disciplines.map((d) => ({ discipline: d as Discipline, units: list.filter((u) => u.discipline === d) })).filter((g) => g.units.length);
  const totalDone = units.filter((u) => ["concluida", "validada"].includes(masteryOf(states[u.id]))).length;

  const stageHref = (u: Unit, stage: string) => (stage === "fundamento" ? `/aluno/trilha/${u.id}` : `/aluno/trilha/${u.id}/${stage}`);

  return (
    <div className="as-page tr-page">
      <header className="as-head">
        <div><h1>Trilha ENEM</h1><p>{units.length} unidades de Matemática e Natureza com fundamento, prática, desafio e revisão. {totalDone ? `${totalDone} concluídas.` : "Você ainda não concluiu nenhuma."}</p></div>
      </header>

      {rec ? (
        <section className="as-today" aria-labelledby="tr-cont">
          <p className="as-today-eyebrow">{rec.reason === "revisao" ? "Revisão agendada" : rec.reason === "continuar" ? "Continuar trilha" : "Comece por aqui"}</p>
          <h2 id="tr-cont">{rec.unit.title}</h2>
          <p className="as-today-reason">{rec.reason === "revisao" ? "Uma revisão curta fixa o que você já aprendeu." : `Próxima etapa: ${STAGE_LABEL[rec.stage]}.`} {rec.unit.objective}</p>
          <div className="as-today-actions">
            <Link className="as-btn as-btn-primary" href={stageHref(rec.unit, rec.stage)}>{rec.reason === "revisao" ? "Revisar agora" : rec.reason === "continuar" ? "Continuar" : "Começar"}</Link>
            <span className="as-tag">≈ {rec.stage === "fundamento" ? rec.unit.minutes : rec.stage === "revisao" ? 5 : 10} min</span>
          </div>
        </section>
      ) : (
        <section className="as-card"><h2>Você percorreu a trilha disponível</h2><p className="as-muted">Todas as unidades abertas estão concluídas. Novas unidades entram conforme o acervo é publicado.</p></section>
      )}

      <PrefsForm initial={prefs} />

      <nav className="tr-areas" aria-label="Áreas da trilha">
        {AREAS.map((a) => {
          const p = areaProgress(a.id, units, states);
          return (
            <Link key={a.id} href={`/aluno/trilha?a=${a.id}`} aria-current={a.id === area ? "page" : undefined}>
              <strong>{a.label}</strong>
              <small>{a.hasContent ? `${p.done}/${p.total} unidades` : "em preparação"}</small>
            </Link>
          );
        })}
      </nav>

      {!areaInfo.hasContent ? (
        <section className="as-card" aria-labelledby="tr-prep">
          <h2 id="tr-prep">{areaInfo.label}: cobertura em preparação</h2>
          <p>{areaInfo.coverageNote}</p>
          <p className="as-muted">Nenhum indicador de conclusão é mostrado para esta área até haver atividades jogáveis aprovadas.</p>
          <div className="op-q-foot"><Link className="as-btn as-btn-primary" href="/aluno/materiais">Abrir meus materiais</Link><Link className="as-btn" href={`${operacao.basePath}/questoes`}>Banco de questões</Link></div>
        </section>
      ) : groups.map((g) => (
        <section key={g.discipline} className="tr-group" aria-labelledby={`tr-g-${g.discipline}`}>
          {areaInfo.disciplines.length > 1 ? <h2 id={`tr-g-${g.discipline}`}>{disciplineLabel[g.discipline]}</h2> : <h2 id={`tr-g-${g.discipline}`} className="op-sr">{disciplineLabel[g.discipline]}</h2>}
          <ol className="tr-map">
            {g.units.map((u) => {
              const st = unitStatus(u, units, states, today);
              const s = states[u.id] as UnitState | undefined;
              const isCurrent = rec?.unit.id === u.id;
              return (
                <li key={u.id} className={`tr-unit is-${st.state}${isCurrent ? " is-current" : ""}`}>
                  <Marker state={st.state} />
                  <div className="tr-unit-body">
                    <h3><Link href={`/aluno/trilha/${u.id}`}>{u.title}</Link></h3>
                    <p className="tr-unit-meta">
                      <span className="tr-status">{statusText[st.state]}</span>
                      <span>≈ {u.minutes} min de leitura</span>
                      {st.reviewDue ? <span className="tr-due">Revisão vencida</span> : null}
                      {u.coverage === "limitada" ? <span>Acervo limitado: {u.pool.length} questões</span> : null}
                      {s?.desafio.tries.length ? <span>Melhor desafio: {Math.max(...s.desafio.tries.map((t) => t.correct))}/{s.desafio.tries[0].total}</span> : null}
                    </p>
                    {st.state === "bloqueada" ? <p className="tr-lock">Bloqueada até concluir: {st.missing.map((m) => m.title).join(", ")}. {prefs.modo === "treinar" ? "No modo Treinar você pode praticar mesmo assim." : "Se você já conhece o tema, faça o teste de avanço."}</p> : <p className="tr-unit-obj">{u.objective}</p>}
                  </div>
                  <Link className={`as-btn${isCurrent ? " as-btn-primary" : ""}`} href={`/aluno/trilha/${u.id}`} aria-label={`${verb[st.state]}: ${u.title}`}>{verb[st.state]}</Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
