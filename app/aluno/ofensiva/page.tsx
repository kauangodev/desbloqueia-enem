import Link from "next/link";
import { studentSummary } from "../../../lib/aluno/summary";
import { todayInSaoPaulo } from "../../../lib/operacao/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ofensiva | GoDev Education" };

const goals = [7, 14, 30, 50];
const goalName: Record<number, string> = { 7: "Boa", 14: "Ótima", 30: "Incrível", 50: "Indestrutível" };
const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const weekdays = ["D", "S", "T", "Q", "Q", "S", "S"];

export default async function StreakPage() {
  const summary = await studentSummary();
  if (!summary) return null;
  const { momentum } = summary;
  const today = todayInSaoPaulo();
  const [year, month] = today.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const studied = new Set(momentum?.activeDays ?? []);
  const cells: { day: number | null; date?: string }[] = [
    ...Array.from({ length: first.getUTCDay() }, () => ({ day: null })),
    ...Array.from({ length }, (_, index) => ({ day: index + 1, date: `${year}-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}` })),
  ];
  const streak = momentum?.streak ?? 0;
  const nextGoal = goals.find((goal) => streak < goal);

  return (
    <div className="as-page">
      <header className="as-head"><div><h1>Ofensiva</h1><p>Estude um pouco todo dia para manter a chama acesa. Responder uma questão, concluir um módulo ou finalizar um treino conta como dia de estudo.</p></div></header>
      {!momentum ? (
        <section className="as-empty"><h2>Sua ofensiva começa no primeiro treino</h2><Link className="as-btn as-btn-primary" href="/aluno/treino-rapido">Treinar agora</Link></section>
      ) : (
        <>
          <div className="as-grid">
            <article className="as-card as-stat"><span>Sequência atual</span><strong>{streak}</strong><small>{streak === 1 ? "dia seguido" : "dias seguidos"}{!momentum.studiedToday && streak > 0 ? " · estude hoje para manter" : ""}</small></article>
            <article className="as-card as-stat"><span>Melhor sequência</span><strong>{momentum.bestStreak}</strong><small>dias seguidos</small></article>
            <article className="as-card as-stat"><span>Dias de estudo</span><strong>{momentum.studyDays}</strong><small>no total</small></article>
          </div>

          <section className="as-card" aria-labelledby="as-o-metas">
            <h2 id="as-o-metas">Metas de sequência</h2>
            <ul className="as-goals">
              {goals.map((goal) => (
                <li key={goal} className={`as-goal${momentum.bestStreak >= goal ? " is-done" : ""}`} style={{ listStyle: "none" }}>
                  <strong>{goal} dias</strong>
                  <small className="as-muted">{goalName[goal]}{momentum.bestStreak >= goal ? " · alcançada" : goal === nextGoal ? ` · faltam ${goal - streak}` : ""}</small>
                </li>
              ))}
            </ul>
          </section>

          <section className="as-card" aria-labelledby="as-o-cal">
            <h2 id="as-o-cal">{monthName.format(first).replace(/^./, (letter) => letter.toUpperCase())}</h2>
            <div className="as-cal" role="grid" aria-label="Dias estudados no mês">
              {weekdays.map((w, index) => <b key={index} role="columnheader">{w}</b>)}
              {cells.map((cell, index) => cell.day === null
                ? <span key={`b${index}`} className="is-blank" aria-hidden="true" />
                : <span key={cell.date} role="gridcell" className={`${studied.has(cell.date!) ? "is-done" : ""}${cell.date === today ? " is-today" : ""}`} aria-label={`${cell.day}: ${studied.has(cell.date!) ? "estudou" : "sem estudo"}${cell.date === today ? " (hoje)" : ""}`}>{cell.day}</span>)}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
