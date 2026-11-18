"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import QuestionCard from "./question-card";
import { post, useOperacaoState } from "./client";
import { applyFilters, emptyFilters, serializeFilters, type Filters } from "../../lib/operacao/filters";
import type { Discipline, Difficulty, PublicQuestion, QuestionMeta } from "../../lib/operacao/types";
import { difficultyLabel, disciplineLabel } from "../../lib/operacao/types";

type Props = { questions: QuestionMeta[]; moduleTitles: Record<string, string>; basePath: string; view: "questoes" | "erros"; initialFilters?: Filters };

const statusOptions = [
  ["todas", "Todas"], ["nao", "Ainda não respondidas"], ["erradas", "Errei na última vez"], ["acertadas", "Acertei na última vez"], ["favoritas", "Favoritas"], ["depois", "Revisar depois"],
] as const;

/**
 * Banco de questões e caderno de erros. Os filtros e a posição ficam na URL: recarregar ou compartilhar o link reabre a mesma
 * seleção. A lista traz só metadados; o enunciado da questão atual (e das próximas) é carregado sob demanda.
 */
export default function QuestionBrowser({ questions, moduleTitles, basePath, view, initialFilters }: Props) {
  const { state, error, patch, reload } = useOperacaoState();
  const [filters, setFilters] = useState<Filters>(initialFilters ?? emptyFilters);
  const [loaded, setLoaded] = useState<Record<string, PublicQuestion>>({});
  const [loadError, setLoadError] = useState("");
  const [copied, setCopied] = useState(false);
  const inflight = useRef<Set<string>>(new Set());

  const topics = useMemo(() => [...new Set(questions.filter((q) => !filters.discipline || q.discipline === filters.discipline).map((q) => q.topic))].sort(), [questions, filters.discipline]);
  const years = useMemo(() => [...new Set(questions.map((q) => q.year).filter((y): y is number => typeof y === "number"))].sort((a, b) => b - a), [questions]);

  const filtered = useMemo(() => (state ? applyFilters(questions, filters, state, view, moduleTitles) : []), [questions, filters, state, view, moduleTitles]);
  const cursor = Math.min(Math.max(filters.position, 1), Math.max(filtered.length, 1)) - 1;
  const meta = filtered[cursor];
  const q: PublicQuestion | undefined = meta ? loaded[meta.id] : undefined;
  const active = useMemo(() => serializeFilters({ ...filters, position: 1 }) !== "", [filters]);

  // Mantém a URL em sincronia com a seleção (sem criar histórico a cada clique).
  useEffect(() => {
    const query = serializeFilters({ ...filters, position: cursor + 1 });
    const next = `${window.location.pathname}${query ? `?${query}` : ""}`;
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", next);
  }, [filters, cursor]);

  // Carrega o enunciado da questão atual (e antecipa as próximas), em vez de enviar centenas de enunciados de uma vez.
  useEffect(() => {
    const wanted = filtered.slice(cursor, cursor + 3).map((m) => m.id).filter((id) => !loaded[id] && !inflight.current.has(id));
    if (!wanted.length) return;
    wanted.forEach((id) => inflight.current.add(id));
    (async () => {
      try {
        const response = await fetch(`/api/operacao/questions?ids=${wanted.join(",")}`);
        if (!response.ok) throw new Error();
        const data = (await response.json()) as { questions: PublicQuestion[] };
        setLoaded((prev) => ({ ...prev, ...Object.fromEntries(data.questions.map((x) => [x.id, x])) }));
        setLoadError("");
      } catch { setLoadError("Não foi possível carregar a questão. Verifique sua conexão."); }
      finally { wanted.forEach((id) => inflight.current.delete(id)); }
    })();
  }, [filtered, cursor, loaded]);

  const change = (patchFilters: Partial<Filters>) => setFilters((current) => ({ ...current, ...patchFilters, position: 1 }));
  const go = (index: number) => setFilters((current) => ({ ...current, position: index + 1 }));

  async function toggle(kind: "fav" | "later", id: string) {
    patch((s) => ({ ...s, [kind]: s[kind].includes(id) ? s[kind].filter((x) => x !== id) : [...s[kind], id] }));
    try { await post({ action: "toggle", kind, ref: id }); } catch { void reload(); }
  }
  function answered(id: string, correct: boolean, firstTry: boolean) {
    patch((s) => { const prev = s.attempts[id]; return { ...s, attempts: { ...s.attempts, [id]: { n: (prev?.n || 0) + 1, last: correct, firstTry: prev ? prev.firstTry : firstTry && correct, everWrong: Boolean(prev?.everWrong) || !correct, at: new Date().toISOString() } } }; });
  }
  async function markReviewed(id: string, reviewed: boolean) {
    patch((s) => ({ ...s, reviewed: { ...s.reviewed, [id]: reviewed } }));
    try { await post({ action: "review", questionId: id, reviewed }); } catch { void reload(); }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* sem permissão da área de transferência */ }
  }

  if (error && !state) return <div className="op-card op-error" role="alert">{error} <button className="op-btn" type="button" onClick={() => void reload()}>Tentar de novo</button></div>;
  if (!state) return <div className="op-card op-muted" role="status">Carregando suas questões…</div>;

  const sel = (id: string, label: string, value: string, onChange: (v: string) => void, options: [string, string][]) => (
    <label className="op-field" htmlFor={id}><span>{label}</span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
    </label>
  );

  return (
    <div className="op-stack">
      <form className="op-card op-filters" aria-label="Filtros de questões" onSubmit={(e) => e.preventDefault()}>
        {sel("f-d", "Disciplina", filters.discipline, (v) => change({ discipline: v as "" | Discipline, topic: "" }), [["", "Todas"], ...(Object.keys(disciplineLabel) as Discipline[]).map((d): [string, string] => [d, disciplineLabel[d]])])}
        {sel("f-t", "Tópico", filters.topic, (v) => change({ topic: v }), [["", "Todos"], ...topics.map((t): [string, string] => [t, t])])}
        {sel("f-o", "Origem", filters.origin, (v) => change({ origin: v as Filters["origin"] }), [["", "Todas"], ["oficial", "Oficial do Enem"], ["autoral", "Autoral no estilo Enem"], ["adaptada", "Adaptada"]])}
        {years.length ? sel("f-y", "Ano da prova", filters.year, (v) => change({ year: v }), [["", "Todos"], ...years.map((y): [string, string] => [String(y), String(y)])]) : null}
        {sel("f-df", "Dificuldade", filters.difficulty, (v) => change({ difficulty: v as "" | Difficulty }), [["", "Todas"], ...(Object.keys(difficultyLabel) as Difficulty[]).map((d): [string, string] => [d, difficultyLabel[d]])])}
        <label className="op-field" htmlFor="f-q"><span>Buscar por assunto</span><input id="f-q" type="search" value={filters.search} onChange={(e) => change({ search: e.target.value })} placeholder="Ex.: juros, mol, genética" /></label>
        {sel("f-dur", "Duração", filters.duration, (v) => change({ duration: v as Filters["duration"] }), [["", "Qualquer"], ["curta", "Curta (até 2 min)"], ["media", "Média (3 min)"], ["longa", "Longa (4 min ou mais)"]])}
        {sel("f-s", "Status", filters.status, (v) => change({ status: v as Filters["status"] }), statusOptions.map(([v, l]): [string, string] => [v, l]))}
        <button type="button" className="op-btn op-btn-ghost" disabled={!active} onClick={() => setFilters({ ...emptyFilters })}>Limpar filtros</button>
      </form>
      {filters.moduleId ? <p className="op-muted">Filtrando pelo módulo “{moduleTitles[filters.moduleId] || filters.moduleId}”. <button type="button" className="op-link" onClick={() => change({ moduleId: "" })}>Remover</button></p> : null}
      <div className="op-q-foot" style={{ justifyContent: "space-between" }}>
        <p className="op-muted" role="status" aria-live="polite" style={{ margin: 0 }}>
          {filtered.length ? `${filtered.length} ${filtered.length === 1 ? "questão" : "questões"} neste filtro · de ${questions.length} no acervo.` : ""}
        </p>
        <button type="button" className="op-btn op-btn-ghost" onClick={copyLink}>{copied ? "Link copiado" : "Copiar link desta seleção"}</button>
      </div>
      {meta && !q ? <div className="op-card op-muted" role="status">{loadError || "Carregando a questão…"} {loadError ? <button type="button" className="op-btn" onClick={() => setLoaded((p) => ({ ...p }))}>Tentar de novo</button> : null}</div> : null}
      {q ? (
        <>
          <QuestionCard q={q} index={cursor} total={filtered.length} moduleTitle={moduleTitles[q.moduleId]} basePath={basePath} favorite={state.fav.includes(q.id)} later={state.later.includes(q.id)} attemptCount={state.attempts[q.id]?.n || 0} onToggle={toggle} onAnswered={answered} context={view === "erros" ? "erros" : "estudo"} />
          <div className="op-pager">
            <button type="button" className="op-btn" disabled={cursor === 0} onClick={() => go(cursor - 1)}>Anterior</button>
            {view === "erros" ? <button type="button" className="op-btn op-btn-ghost" aria-pressed={Boolean(state.reviewed[q.id])} onClick={() => markReviewed(q.id, !state.reviewed[q.id])}>{state.reviewed[q.id] ? "Revisado ✓ (desfazer)" : "Marcar como revisado"}</button> : null}
            <button type="button" className="op-btn op-btn-primary" disabled={cursor >= filtered.length - 1} onClick={() => go(cursor + 1)}>Próxima</button>
          </div>
          {filtered.length > 5 ? (
            <label className="op-field" htmlFor="f-jump" style={{ maxWidth: 240 }}><span>Ir para a questão</span>
              <input id="f-jump" type="number" min={1} max={filtered.length} value={cursor + 1} onChange={(e) => { const n = Math.floor(Number(e.target.value)); if (Number.isFinite(n) && n >= 1 && n <= filtered.length) go(n - 1); }} />
            </label>
          ) : null}
        </>
      ) : meta ? null : (
        <div className="op-card op-empty">
          <h3>{view === "erros" ? "Nada para revisar por aqui" : "Nenhuma questão neste filtro"}</h3>
          <p>{view === "erros" ? "Quando você errar uma questão ou marcar uma para revisar depois, ela aparece neste caderno com a resolução e o erro comum." : "Mude ou limpe os filtros para ver outras questões."}</p>
          <button type="button" className="op-btn" onClick={() => setFilters({ ...emptyFilters })}>Limpar filtros</button>
        </div>
      )}
    </div>
  );
}
