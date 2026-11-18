import Link from "next/link";
import { modules, questions } from "../../../lib/operacao/catalog";
import { addDays, operacao, todayInSaoPaulo } from "../../../lib/operacao/config";
import { diagnose, MIN_SAMPLE } from "../../../lib/operacao/diagnostic";
import type { Attempt, Session } from "../../../lib/operacao/engine";
import { sessionKinds, type SessionKind } from "../../../lib/operacao/kinds";
import { operacaoUser } from "../../../lib/operacao/store";
import { disciplineLabel, type Discipline } from "../../../lib/operacao/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard | GoDev Education" };

const order: Discipline[] = ["matematica", "fisica", "quimica", "biologia"];
const periods = [["7", "7 dias", 7], ["30", "30 dias", 30], ["90", "90 dias", 90], ["tudo", "Tudo", null]] as const;
const pct = (value: number | null) => (value === null ? "—" : `${value}%`);

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<{ p?: string }> }) {
  const requested = (await searchParams)?.p;
  const period = periods.find(([key]) => key === requested) ?? periods[3];
  const user = await operacaoUser();
  if (!user) {
    return (
      <div className="as-page">
        <header className="as-head"><div><h1>Dashboard</h1><p>Onde você está acertando e onde precisa revisar.</p></div></header>
        <section className="as-empty"><h2>Seu diagnóstico aparece aqui</h2><p className="as-muted">Ele é montado a partir das questões que você resolve. Ative um plano para começar.</p><Link className="as-btn as-btn-primary" href="/aluno/planos">Ver planos</Link></section>
      </div>
    );
  }
  let failed = false;
  let attempts: { ref: string; data: Attempt }[] = [];
  let sessions: { ref: string; data: Session }[] = [];
  try {
    [attempts, sessions] = await Promise.all([user.kv.list<Attempt>("attempt"), user.kv.list<Session>("session")]);
  } catch { failed = true; }
  const today = todayInSaoPaulo();
  const diag = diagnose(attempts.map((row) => ({ id: row.ref, history: row.data.history })), questions.map((q) => ({ id: q.id, discipline: q.discipline, topic: q.topic })), today, 14, period[2]);
  const moduleOfTopic = new Map(questions.map((q) => [`${q.discipline}|${q.topic}`, q.moduleId]));
  const moduleTitle = Object.fromEntries(modules.map((m) => [m.id, m.title]));
  const finished = sessions
    .filter((row) => row.data.finishedAt && row.data.result && (!period[2] || todayInSaoPaulo(new Date(row.data.finishedAt)) >= addDays(today, -(period[2] - 1))))
    .sort((a, b) => Date.parse(b.data.finishedAt!) - Date.parse(a.data.finishedAt!)).slice(0, 6);
  const max = Math.max(1, ...diag.series.map((day) => day.answers));
  const label = period[2] ? `nos últimos ${period[2]} dias` : "em todo o histórico";

  return (
    <div className="as-page">
      <header className="as-head">
        <div><h1>Dashboard</h1><p>Diagnóstico calculado só das questões que você respondeu. Não é nota do Enem nem estimativa de TRI.</p></div>
        <Link className="as-btn as-btn-primary" href="/aluno/treino-rapido">Treinar agora</Link>
      </header>

      <nav className="as-periods" aria-label="Período do diagnóstico">
        {periods.map(([key, text]) => <Link key={key} className="as-btn" href={key === "tudo" ? "/aluno/dashboard" : `/aluno/dashboard?p=${key}`} aria-current={period[0] === key ? "page" : undefined}>{text}</Link>)}
      </nav>
      {failed ? <p className="op-error" role="alert">Não foi possível carregar seu histórico agora. Tente recarregar a página.</p> : null}

      {diag.total === 0 && !failed ? (
        <section className="as-empty">
          <h2>{period[2] ? `Nenhuma questão respondida ${label}` : "Ainda não há dados para o diagnóstico"}</h2>
          <p className="as-muted">{period[2] ? "Tente um período maior ou resolva algumas questões agora." : "Resolva algumas questões no treino rápido. Depois de poucas respostas, mostramos acertos por disciplina e os tópicos que pedem revisão."}</p>
          <div className="op-q-foot">
            <Link className="as-btn as-btn-primary" href="/aluno/treino-rapido">Começar um treino</Link>
            {period[2] ? <Link className="as-btn" href="/aluno/dashboard">Ver todo o histórico</Link> : null}
          </div>
        </section>
      ) : (
        <>
          {diag.sampleTooSmall ? <p className="op-note" role="note">Amostra pequena: {diag.total} {diag.total === 1 ? "questão" : "questões"} {label}. Com menos de {MIN_SAMPLE}, os percentuais oscilam muito e não devem ser lidos como conclusão.</p> : null}
          <div className="as-grid">
            <article className="as-card as-stat"><span>Questões respondidas</span><strong>{diag.total}</strong><small>distintas, {label}</small></article>
            <article className="as-card as-stat"><span>Acertos de primeira</span><strong>{pct(diag.firstTryPct)}</strong><small>{diag.firstAttempts ? `${Math.round(((diag.firstTryPct ?? 0) / 100) * diag.firstAttempts)} de ${diag.firstAttempts} primeiras tentativas` : "nenhuma primeira tentativa no período"}</small></article>
            <article className="as-card as-stat"><span>Resultado atual</span><strong>{pct(diag.lastPct)}</strong><small>{Math.round(((diag.lastPct ?? 0) / 100) * diag.total)} de {diag.total} na última tentativa</small></article>
          </div>

          <div className="as-grid-2">
            <section className="as-card" aria-labelledby="as-disc">
              <h2 id="as-disc">Desempenho por disciplina</h2>
              <div className="as-page">
                {order.map((d) => {
                  const b = diag.disciplines[d];
                  const value = b?.firstTryPct ?? 0;
                  return (
                    <div className="as-meter" key={d}>
                      <div className="as-meter-head"><strong>{disciplineLabel[d]}</strong><span className="as-muted">{b ? `${b.firstTry}/${b.firstAttempts} de primeira · atual ${b.lastOk}/${b.answered}${b.answered < 3 ? " · amostra pequena" : ""}` : "sem respostas no período"}</span></div>
                      <span className="op-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={`Acertos de primeira em ${disciplineLabel[d]}`}><i style={{ width: `${value}%` }} /></span>
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="as-card" aria-labelledby="as-14">
              <h2 id="as-14">Atividade dos últimos 14 dias</h2>
              <ul className="as-bars" aria-label="Respostas por dia">
                {diag.series.map((day) => (
                  <li key={day.date} data-zero={day.answers === 0} title={`${day.date.split("-").reverse().join("/")}: ${day.answers} respostas`}>
                    <i style={{ height: `${Math.max(3, Math.round((day.answers / max) * 100))}%` }} />
                    <span className="op-sr">{day.date.split("-").reverse().join("/")}: {day.answers} respostas</span>
                  </li>
                ))}
              </ul>
              <div className="as-bars-axis" aria-hidden="true"><span>{diag.series[0].date.slice(8)}/{diag.series[0].date.slice(5, 7)}</span><span>hoje</span></div>
            </section>
          </div>

          <div className="as-grid-2">
            <section className="as-card" aria-labelledby="as-weak">
              <h2 id="as-weak">Tópicos para revisar</h2>
              {diag.weak.length ? (
                <ul className="as-list">
                  {diag.weak.map((t) => {
                    const moduleId = moduleOfTopic.get(`${t.discipline}|${t.topic}`);
                    return (
                      <li key={`${t.discipline}-${t.topic}`}>
                        <span><strong>{t.topic}</strong><br /><small className="as-muted">{disciplineLabel[t.discipline]} · {t.lastOk}/{t.answered} certas na última tentativa</small></span>
                        <span className="as-links">
                          <Link className="op-link" href={`/aluno/treino-rapido?d=${t.discipline}`}>Treinar</Link>
                          {moduleId ? <Link className="op-link" href={`${operacao.basePath}/materiais/${moduleId}`} title={moduleTitle[moduleId]}>Rever o conteúdo</Link> : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="as-muted">Nenhum tópico abaixo de 60% com pelo menos 2 questões {label}. Continue praticando para o diagnóstico ficar mais preciso.</p>}
              {diag.strong.length ? <p className="as-muted">Pontos fortes: {diag.strong.map((t) => t.topic).join(", ")}.</p> : null}
            </section>
            <section className="as-card" aria-labelledby="as-sims">
              <h2 id="as-sims">Últimos simulados e treinos</h2>
              {finished.length ? (
                <ul className="as-list">
                  {finished.map((row) => (
                    <li key={row.ref}>
                      <span>{(sessionKinds[row.data.kind as SessionKind]?.title || row.data.kind).split(" — ")[0]}<br /><small className="as-muted">{new Date(row.data.finishedAt!).toLocaleDateString("pt-BR")} · {row.data.result!.correct}/{row.data.result!.total}</small></span>
                      <strong>{row.data.result!.percent}%</strong>
                    </li>
                  ))}
                </ul>
              ) : <p className="as-muted">Nenhum treino ou simulado concluído {label}. <Link className="op-link" href={`${operacao.basePath}/treinos`}>Fazer agora</Link></p>}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
