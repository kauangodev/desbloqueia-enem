import Link from "next/link";
import { studentSummary } from "../../../lib/aluno/summary";
import { todayInSaoPaulo } from "../../../lib/operacao/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Missões | GoDev Education" };

const MONTH_TARGET = 15;
const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" });

export default async function MissionsPage() {
  const summary = await studentSummary();
  if (!summary) return null;
  const { momentum, progress } = summary;
  const today = todayInSaoPaulo();
  const month = today.slice(0, 7);
  const monthLabel = monthName.format(new Date(`${today}T12:00:00Z`));
  const studiedThisMonth = momentum ? momentum.activeDays.filter((day) => day.startsWith(month)).length : 0;
  const monthPct = Math.min(100, Math.round((studiedThisMonth / MONTH_TARGET) * 100));
  const daysLeft = (() => { const [y, m] = today.split("-").map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate() - Number(today.slice(8)); })();

  return (
    <div className="as-page">
      <header className="as-head"><div><h1>Missões</h1><p>Três missões por dia e um desafio do mês. As missões trocam à meia-noite (horário de Brasília).</p></div></header>
      {!momentum ? (
        <section className="as-empty"><h2>As missões começam com o seu acesso</h2><p className="as-muted">Ative um plano para praticar e cumprir as missões do dia.</p><Link className="as-btn as-btn-primary" href="/aluno/planos">Ver planos</Link></section>
      ) : (
        <>
          <section className="as-card" aria-labelledby="as-m-hoje">
            <h2 id="as-m-hoje">Missões de hoje <span className="as-tag">{momentum.missionsDone}/{momentum.missions.length}</span></h2>
            <ul className="as-list">
              {momentum.missions.map((mission) => (
                <li key={mission.id}>
                  <span><strong>{mission.title}</strong><br /><small className="as-muted">{mission.detail}</small></span>
                  <span className={`as-tag`}>{mission.done ? "Concluída" : `${mission.progress}/${mission.target}`}</span>
                </li>
              ))}
            </ul>
            {momentum.missionsDone === momentum.missions.length ? <p>Todas as missões de hoje foram cumpridas. Descansar também faz parte.</p> : <Link className="as-btn as-btn-primary" href="/aluno/treino-rapido">Treinar agora</Link>}
          </section>

          <section className="as-card" aria-labelledby="as-m-mes">
            <h2 id="as-m-mes">Desafio de {monthLabel}</h2>
            <div className="as-meter">
              <div className="as-meter-head"><strong>Estude em {MONTH_TARGET} dias diferentes</strong><span className="as-muted">{studiedThisMonth}/{MONTH_TARGET} · {daysLeft === 0 ? "último dia" : `faltam ${daysLeft} dias do mês`}</span></div>
              <span className="op-bar" role="progressbar" aria-valuemin={0} aria-valuemax={MONTH_TARGET} aria-valuenow={Math.min(studiedThisMonth, MONTH_TARGET)} aria-label="Dias estudados no mês"><i style={{ width: `${monthPct}%` }} /></span>
            </div>
            <p className="as-muted">{studiedThisMonth >= MONTH_TARGET ? "Desafio do mês cumprido." : "Qualquer questão respondida, módulo concluído ou treino finalizado conta como dia de estudo."}</p>
          </section>

          {progress ? (
            <section className="as-card" aria-labelledby="as-m-conq">
              <h2 id="as-m-conq">Conquistas</h2>
              <ul className="as-goals">
                {progress.gamification.achievements.map((a) => (
                  <li key={a.id} className={`as-goal${a.done ? " is-done" : ""}`} style={{ listStyle: "none" }}>
                    <strong>{a.done ? "✓ " : ""}{a.label}</strong>
                    <small className="as-muted">{a.done ? "Conquistada" : "Ainda não"}</small>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
