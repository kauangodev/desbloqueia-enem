import Link from "next/link";
import type { TodayAction } from "../../lib/aluno/today";

/** Primeira dobra do início: uma ação principal com motivo e duração, mais as alternativas e o estado da próxima prova. */
export default function TodayCard({ primary, others, examNote }: { primary: TodayAction; others: TodayAction[]; examNote?: string }) {
  return (
    <section className="as-today" aria-labelledby="as-today-t">
      <p className="as-today-eyebrow">Hoje</p>
      <h2 id="as-today-t">{primary.title}</h2>
      <p className="as-today-reason">{primary.reason}</p>
      <div className="as-today-actions">
        <Link className="as-btn as-btn-primary" href={primary.href} data-analytics-event={`today_${primary.kind}`}>{primary.cta}</Link>
        {primary.minutes ? <span className="as-tag">≈ {primary.minutes} min</span> : null}
      </div>
      {others.length ? (
        <div className="as-today-others">
          <p className="as-muted">{primary.kind === "sessao" && others.some((item) => item.kind === "sessao") ? "Outras atividades em andamento e opções:" : "Ou escolha outra coisa:"}</p>
          <ul>
            {others.map((item) => (
              <li key={item.id}><Link className="op-link" href={item.href}>{item.title}</Link>{item.minutes ? <small className="as-muted"> · ≈ {item.minutes} min</small> : null}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {examNote ? <p className="as-today-note">{examNote}</p> : null}
    </section>
  );
}
