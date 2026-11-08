"use client";
import Link from "next/link";
import { useState } from "react";
import { ApiError, post, useOperacaoState } from "./client";
import type { PlanDay } from "../../lib/operacao/plan";

type Props = { plans: Record<"30" | "60" | "120", PlanDay[]>; today: string };

export default function PlanView({ plans, today }: Props) {
  const { state, error, patch, reload } = useOperacaoState();
  const [pending, setPending] = useState<string>("");
  const [note, setNote] = useState("");
  const [scheduleMsg, setScheduleMsg] = useState("");
  const minutes = ((state?.planMinutes as 30 | 60 | 120 | null) || 60);
  const days = plans[String(minutes) as "30" | "60" | "120"];

  async function choose(value: 30 | 60 | 120) {
    patch((s) => ({ ...s, planMinutes: value }));
    try { await post({ action: "plan", minutes: value }); setNote(""); } catch (e) { setNote(e instanceof ApiError ? e.message : "Não foi possível salvar sua escolha."); void reload(); }
  }
  async function toggle(id: string, done: boolean) {
    if (pending === id) return;
    setPending(id);
    patch((s) => ({ ...s, planDone: done ? [...new Set([...s.planDone, id])] : s.planDone.filter((x) => x !== id) }));
    try { await post({ action: "planDone", taskId: id, done }); } catch (e) { setNote(e instanceof ApiError ? e.message : "Não foi possível salvar."); void reload(); }
    finally { setPending(""); }
  }
  async function addToSchedule(day: PlanDay) {
    setScheduleMsg("");
    try {
      for (const task of day.tasks.filter((t) => t.type !== "pausa")) {
        const response = await fetch("/api/study", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: `Operação 2º Domingo: ${task.title}`, date: day.date }) });
        if (!response.ok) throw new Error();
      }
      setScheduleMsg(`Tarefas de ${day.label} adicionadas ao seu cronograma.`);
    } catch { setScheduleMsg("Não foi possível adicionar ao cronograma agora. Seu plano continua salvo aqui."); }
  }

  if (!state && !error) return <div className="op-card op-muted" role="status">Carregando seu plano…</div>;
  const done = new Set(state?.planDone || []);

  return (
    <div className="op-stack">
      {error ? <p className="op-error" role="alert">{error}</p> : null}
      <fieldset className="op-card op-choice">
        <legend>Quanto tempo você tem por dia?</legend>
        <div className="op-segment" role="radiogroup" aria-label="Tempo diário de estudo">
          {([30, 60, 120] as const).map((value) => (
            <button key={value} type="button" role="radio" aria-checked={minutes === value} className={`op-seg ${minutes === value ? "is-on" : ""}`} onClick={() => void choose(value)}>{value === 120 ? "2 horas" : value === 60 ? "1 hora" : "30 min"}</button>
          ))}
        </div>
        <p className="op-muted">O plano mostra só os dias que faltam. Se você perder um dia, siga a partir de hoje: nada fica “atrasado”.</p>
      </fieldset>
      {note ? <p className="op-error" role="alert">{note}</p> : null}
      {scheduleMsg ? <p className="op-note" role="status">{scheduleMsg}</p> : null}
      {!days.length ? <div className="op-card"><h3>O 2º dia já passou</h3><p>Não há dias restantes para planejar. Seu histórico e seus erros continuam disponíveis.</p></div> : null}
      <div className="op-stack">
        {days.map((day) => (
          <section key={day.date} className={`op-card op-day ${day.date === today ? "is-today" : ""} ${day.isExamDay ? "is-exam" : ""}`} aria-labelledby={`d-${day.date}`}>
            <header className="op-day-head">
              <div><h3 id={`d-${day.date}`}>{day.label}{day.date === today ? " · hoje" : ""}</h3><p className="op-muted">{day.theme} · ≈ {day.totalMinutes} min</p></div>
              {!day.isExamDay ? <button type="button" className="op-btn op-btn-ghost" onClick={() => void addToSchedule(day)}>Adicionar ao Meu cronograma</button> : null}
            </header>
            <ul className="op-tasks">
              {day.tasks.map((task) => (
                <li key={task.id} className={done.has(task.id) ? "is-done" : ""}>
                  <label className="op-check"><input type="checkbox" checked={done.has(task.id)} disabled={pending === task.id} onChange={(e) => void toggle(task.id, e.target.checked)} /><span><strong>{task.title}</strong> <em>{task.minutes} min</em><br /><span className="op-muted">{task.detail}</span></span></label>
                  {task.href ? <Link className="op-btn op-btn-ghost" href={task.href}>Abrir</Link> : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
