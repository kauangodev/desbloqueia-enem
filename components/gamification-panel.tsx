"use client";
import { useEffect, useState } from "react";

type Summary = { streak?: number; todayEvents?: number; weekEvents?: number; xp: number; level: number; nextLevelXp: number; events: number; studyDays: number; dailyTarget: number; weeklyTarget: number; achievements?: { id: string; title: string; description: string; unlocked: boolean }[]; ruleVersion?: string };
const initial: Summary = { xp: 0, level: 1, nextLevelXp: 100, events: 0, studyDays: 0, dailyTarget: 1, weeklyTarget: 5 };

export default function GamificationPanel() {
  const [summary, setSummary] = useState(initial);
  const [state, setState] = useState("Carregando seu progresso…");
  useEffect(() => {
    fetch("/api/gamification", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => { setSummary(data); setState(""); })
      .catch(() => setState("O painel de progresso será ativado após a migração de gamificação."));
  }, []);
  const progress = Math.min(100, Math.round(((summary.xp % 100) / 100) * 100));
  return (
    <section className="student-section-block gamification-panel" aria-labelledby="gamification-title">
      <div className="student-section-heading"><div><span className="student-eyebrow">Ritmo de estudo</span><h2 id="gamification-title">Seu progresso real</h2></div><span className="student-count">Nível {summary.level}</span></div>
      {state && <p className="status-message" role="status">{state}</p>}
      <div className="student-stat-grid">
        <article className="student-stat-card accent"><span>XP acumulado</span><strong>{summary.xp}</strong><small>Progresso de estudo</small></article>
        <article className="student-stat-card"><span>Dias de estudo</span><strong>{summary.studyDays}</strong><small>Eventos válidos: {summary.events}</small></article>
      </div>
      <div className="progress-track" aria-label={`${progress}% para o próximo nível`}><span style={{ width: `${progress}%` }} /></div>
      <p className="subtle">{Math.max(0, summary.nextLevelXp - summary.xp)} XP para o próximo nível. Hoje: {summary.todayEvents || 0}/{summary.dailyTarget} atividade(s). Semana: {summary.weekEvents || 0}/{summary.weeklyTarget}. Sequência: {summary.streak || 0} dia(s).</p>
      {summary.achievements?.length ? <div className="gamification-achievements" aria-labelledby="achievements-title"><div className="gamification-achievements-heading"><strong id="achievements-title">Conquistas</strong><span>{summary.achievements.filter((item) => item.unlocked).length}/{summary.achievements.length} desbloqueadas</span></div><div className="gamification-achievement-grid">{summary.achievements.map((item) => <article className={`gamification-achievement ${item.unlocked ? "is-unlocked" : ""}`} key={item.id}><span aria-hidden="true">{item.unlocked ? "✓" : "○"}</span><div><strong>{item.title}</strong><small>{item.description}</small></div></article>)}</div></div> : null}
    </section>
  );
}

