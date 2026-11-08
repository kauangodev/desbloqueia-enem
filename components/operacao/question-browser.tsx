"use client";
import { useEffect, useMemo, useState } from "react";
import QuestionCard from "./question-card";
import { local, post, useOperacaoState } from "./client";
import type { Discipline, Difficulty, Origin, PublicQuestion } from "../../lib/operacao/types";
import { difficultyLabel, disciplineLabel } from "../../lib/operacao/types";

type Props = { questions: PublicQuestion[]; moduleTitles: Record<string, string>; basePath: string; view: "questoes" | "erros"; initialModule?: string };

const statusOptions = [
  ["todas", "Todas"], ["nao", "Ainda não respondidas"], ["erradas", "Errei na última vez"], ["acertadas", "Acertei na última vez"], ["favoritas", "Favoritas"], ["depois", "Revisar depois"],
] as const;
type Status = (typeof statusOptions)[number][0];

export default function QuestionBrowser({ questions, moduleTitles, basePath, view, initialModule }: Props) {
  const { state, error, patch, reload } = useOperacaoState();
  const [discipline, setDiscipline] = useState<"" | Discipline>("");
  const [topic, setTopic] = useState("");
  const [origin, setOrigin] = useState<"" | Origin>("");
  const [difficulty, setDifficulty] = useState<"" | Difficulty>("");
  const [status, setStatus] = useState<Status>("todas");
  const [moduleId, setModuleId] = useState(initialModule || "");
  const [cursor, setCursor] = useState(0);
  const key = `godev-operacao-${view}-cursor`;

  useEffect(() => { const saved = Number(local.get(key)); if (Number.isFinite(saved) && saved > 0) setCursor(saved); }, [key]);

  const topics = useMemo(() => [...new Set(questions.filter((q) => !discipline || q.discipline === discipline).map((q) => q.topic))].sort(), [questions, discipline]);

  const filtered = useMemo(() => {
    if (!state) return [];
    return questions.filter((q) => {
      const a = state.attempts[q.id];
      if (view === "erros" && !(a?.everWrong || state.later.includes(q.id))) return false;
      if (discipline && q.discipline !== discipline) return false;
      if (topic && q.topic !== topic) return false;
      if (origin && q.origin !== origin) return false;
      if (difficulty && q.difficulty !== difficulty) return false;
      if (moduleId && q.moduleId !== moduleId) return false;
      switch (status) {
        case "nao": return !a;
        case "erradas": return a?.last === false;
        case "acertadas": return a?.last === true;
        case "favoritas": return state.fav.includes(q.id);
        case "depois": return state.later.includes(q.id);
        default: return true;
      }
    });
  }, [questions, state, view, discipline, topic, origin, difficulty, moduleId, status]);

  const safeCursor = Math.min(cursor, Math.max(filtered.length - 1, 0));
  useEffect(() => { local.set(key, String(safeCursor)); }, [key, safeCursor]);
  const q = filtered[safeCursor];

  async function toggle(kind: "fav" | "later", id: string) {
    const list = kind === "fav" ? "fav" : "later";
    patch((s) => ({ ...s, [list]: s[list].includes(id) ? s[list].filter((x) => x !== id) : [...s[list], id] }));
    try { await post({ action: "toggle", kind, ref: id }); } catch { void reload(); }
  }
  function answered(id: string, correct: boolean, firstTry: boolean) {
    patch((s) => { const prev = s.attempts[id]; return { ...s, attempts: { ...s.attempts, [id]: { n: (prev?.n || 0) + 1, last: correct, firstTry: prev ? prev.firstTry : firstTry && correct, everWrong: Boolean(prev?.everWrong) || !correct, at: new Date().toISOString() } } }; });
  }
  async function markReviewed(id: string, reviewed: boolean) {
    patch((s) => ({ ...s, reviewed: { ...s.reviewed, [id]: reviewed } }));
    try { await post({ action: "review", questionId: id, reviewed }); } catch { void reload(); }
  }

  const reset = () => { setDiscipline(""); setTopic(""); setOrigin(""); setDifficulty(""); setModuleId(""); setStatus("todas"); setCursor(0); };
  const sel = (label: string, value: string, set: (v: never) => void, options: [string, string][]) => (
    <label className="op-field"><span>{label}</span>
      <select value={value} onChange={(e) => { set(e.target.value as never); setCursor(0); }}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );

  if (error && !state) return <div className="op-card op-error" role="alert">{error} <button className="op-btn" type="button" onClick={() => void reload()}>Tentar de novo</button></div>;
  if (!state) return <div className="op-card op-muted" role="status">Carregando suas questões…</div>;

  return (
    <div className="op-stack">
      <form className="op-card op-filters" aria-label="Filtros de questões" onSubmit={(e) => e.preventDefault()}>
        {sel("Disciplina", discipline, (v: "" | Discipline) => { setDiscipline(v); setTopic(""); }, [["", "Todas"], ...(Object.keys(disciplineLabel) as Discipline[]).map((d): [string, string] => [d, disciplineLabel[d]])])}
        {sel("Tópico", topic, setTopic, [["", "Todos"], ...topics.map((t): [string, string] => [t, t])])}
        {sel("Origem", origin, setOrigin, [["", "Todas"], ["oficial", "Oficial do Enem"], ["autoral", "Autoral no estilo Enem"], ["adaptada", "Adaptada"]])}
        {sel("Dificuldade", difficulty, setDifficulty, [["", "Todas"], ...(Object.keys(difficultyLabel) as Difficulty[]).map((d): [string, string] => [d, difficultyLabel[d]])])}
        {sel("Status", status, setStatus, statusOptions.map(([v, l]): [string, string] => [v, l]))}
        <button type="button" className="op-btn op-btn-ghost" onClick={reset}>Limpar filtros</button>
      </form>
      {moduleId ? <p className="op-muted">Filtrando pelo módulo “{moduleTitles[moduleId] || moduleId}”. <button type="button" className="op-link" onClick={() => setModuleId("")}>Remover</button></p> : null}
      <p className="op-muted" role="status" aria-live="polite">{filtered.length ? `${filtered.length} questão(ões) neste filtro.` : ""}</p>
      {q ? (
        <>
          <QuestionCard q={q} index={safeCursor} total={filtered.length} moduleTitle={moduleTitles[q.moduleId]} basePath={basePath} favorite={state.fav.includes(q.id)} later={state.later.includes(q.id)} attemptCount={state.attempts[q.id]?.n || 0} onToggle={toggle} onAnswered={answered} context={view === "erros" ? "erros" : "estudo"} />
          <div className="op-pager">
            <button type="button" className="op-btn" disabled={safeCursor === 0} onClick={() => setCursor(safeCursor - 1)}>Anterior</button>
            {view === "erros" ? <button type="button" className="op-btn op-btn-ghost" aria-pressed={Boolean(state.reviewed[q.id])} onClick={() => markReviewed(q.id, !state.reviewed[q.id])}>{state.reviewed[q.id] ? "Revisado ✓ (desfazer)" : "Marcar como revisado"}</button> : null}
            <button type="button" className="op-btn op-btn-primary" disabled={safeCursor >= filtered.length - 1} onClick={() => setCursor(safeCursor + 1)}>Próxima</button>
          </div>
        </>
      ) : (
        <div className="op-card op-empty">
          <h3>{view === "erros" ? "Nada para revisar por aqui" : "Nenhuma questão neste filtro"}</h3>
          <p>{view === "erros" ? "Quando você errar uma questão ou marcar uma para revisar depois, ela aparece neste caderno com a resolução e o erro comum." : "Mude ou limpe os filtros para ver outras questões."}</p>
          <button type="button" className="op-btn" onClick={reset}>Limpar filtros</button>
        </div>
      )}
    </div>
  );
}
