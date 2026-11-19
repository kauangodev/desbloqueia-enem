import Link from "next/link";
import type { TodayAction } from "../../lib/aluno/today";

/**
 * Primeira dobra do início: banner enxuto com UMA ação principal (motivo e duração). As alternativas e o aviso de calendário saem do banner
 * e vão para uma linha secundária logo abaixo, para os módulos úteis aparecerem sem rolar. Nenhuma função foi removida.
 */
export default function TodayCard({ primary, others, examNote }: { primary: TodayAction; others: TodayAction[]; examNote?: string }) {
  return (
    <>
      <section className="as-today" aria-labelledby="as-today-t">
        <p className="as-today-eyebrow">Seu próximo passo</p>
        <h2 id="as-today-t">{primary.title}</h2>
        <p className="as-today-reason">{primary.reason}</p>
        <div className="as-today-actions">
          <Link className="as-btn as-btn-primary" href={primary.href} data-analytics-event={`today_${primary.kind}`}>{primary.cta}</Link>
          {primary.minutes ? <span className="as-tag">≈ {primary.minutes} min</span> : null}
        </div>
      </section>
      {others.length || examNote ? (
        <div className="as-today-more">
          {others.length ? (
            <details>
              <summary>{primary.kind === "sessao" && others.some((item) => item.kind === "sessao") ? "Outras atividades em andamento e opções" : "Ou escolha outra coisa"} ({others.length})</summary>
              <ul>
                {others.map((item) => (
                  <li key={item.id}><Link className="op-link" href={item.href}>{item.title}</Link>{item.minutes ? <small className="as-muted"> · ≈ {item.minutes} min</small> : null}</li>
                ))}
              </ul>
            </details>
          ) : null}
          {examNote ? <p className="as-today-note">{examNote}</p> : null}
        </div>
      ) : null}
    </>
  );
}
