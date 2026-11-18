"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import QuestionCard from "./question-card";
import { post, useOperacaoState } from "./client";
import { applyFilters, emptyFilters, serializeFilters, type Filters } from "../../lib/operacao/filters";
import type { Discipline, Difficulty, PublicQuestion, QuestionMeta } from "../../lib/operacao/types";
import { difficultyLabel, disciplineLabel } from "../../lib/operacao/types";

type Props = { questions: QuestionMeta[]; moduleTitles: Record<string, string>; basePath: string; view: "questoes" | "erros"; initialFilters?: Filters };

const statusLabels = { todas: "Todas", nao: "Ainda não respondidas", erradas: "Errei na última vez", acertadas: "Acertei na última vez", favoritas: "Favoritas", depois: "Revisar depois" } as const;
const originLabels = { oficial: "Oficial do Enem", autoral: "Autoral no estilo Enem", adaptada: "Adaptada" } as const;
const durationLabels = { curta: "Curta (até 2 min)", media: "Média (3 min)", longa: "Longa (4 min ou mais)" } as const;

/**
 * Banco de questões e caderno de erros. Os filtros e a posição ficam na URL: recarregar ou compartilhar o link reabre a mesma
 * seleção. A lista traz só metadados; o enunciado da questão atual (e das próximas) é carregado sob demanda.
 * Layout: busca + filtros mais usados na primeira linha, filtros avançados num painel, filtros ativos como chips removíveis.
 */
export default function QuestionBrowser({ questions, moduleTitles, basePath, view, initialFilters }: Props) {
  const { state, error, patch, reload } = useOperacaoState();
  const [filters, setFilters] = useState<Filters>(initialFilters ?? emptyFilters);
  const [loaded, setLoaded] = useState<Record<string, PublicQuestion>>({});
  const [loadError, setLoadError] = useState("");
  const [copied, setCopied] = useState(false);
  const [panel, setPanel] = useState(false);
  const inflight = useRef<Set<string>>(new Set());
  const toggleRef = useRef<HTMLButtonElement>(null);

  const topics = useMemo(() => [...new Set(questions.filter((q) => !filters.discipline || q.discipline === filters.discipline).map((q) => q.topic))].sort(), [questions, filters.discipline]);
  const years = useMemo(() => [...new Set(questions.map((q) => q.year).filter((y): y is number => typeof y === "number"))].sort((a, b) => b - a), [questions]);

  const filtered = useMemo(() => (state ? applyFilters(questions, filters, state, view, moduleTitles) : []), [questions, filters, state, view, moduleTitles]);
  const cursor = Math.min(Math.max(filters.position, 1), Math.max(filtered.length, 1)) - 1;
  const meta = filtered[cursor];
  const q: PublicQuestion | undefined = meta ? loaded[meta.id] : undefined;

  // Filtros ativos (para os chips e para a contagem do botão "Filtros"). Disciplina, tópico e busca ficam na primeira linha.
  const chips = useMemo(() => {
    const list: { key: string; label: string; clear: Partial<Filters> }[] = [];
    if (filters.discipline) list.push({ key: "d", label: disciplineLabel[filters.discipline], clear: { discipline: "", topic: "" } });
    if (filters.topic) list.push({ key: "t", label: filters.topic, clear: { topic: "" } });
    if (filters.origin) list.push({ key: "o", label: originLabels[filters.origin], clear: { origin: "" } });
    if (filters.year) list.push({ key: "y", label: `Prova de ${filters.year}`, clear: { year: "" } });
    if (filters.difficulty) list.push({ key: "df", label: difficultyLabel[filters.difficulty], clear: { difficulty: "" } });
    if (filters.duration) list.push({ key: "dur", label: durationLabels[filters.duration], clear: { duration: "" } });
    if (filters.status !== "todas") list.push({ key: "s", label: statusLabels[filters.status], clear: { status: "todas" } });
    if (filters.moduleId) list.push({ key: "m", label: `Módulo: ${moduleTitles[filters.moduleId] || filters.moduleId}`, clear: { moduleId: "" } });
    if (filters.search.trim()) list.push({ key: "q", label: `“${filters.search.trim()}”`, clear: { search: "" } });
    return list;
  }, [filters, moduleTitles]);
  const advancedCount = chips.filter((chip) => ["o", "y", "df", "dur", "s", "m"].includes(chip.key)).length;

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

  // Esc fecha o painel de filtros e devolve o foco ao botão que o abriu.
  useEffect(() => {
    if (!panel) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setPanel(false); toggleRef.current?.focus(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [panel]);

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

  const select = (id: string, label: string, value: string, onChange: (v: string) => void, options: [string, string][]) => (
    <label className="bq-field" htmlFor={id}><span>{label}</span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
    </label>
  );

  return (
    <div className="bq">
      <form className="bq-toolbar" role="search" aria-label="Buscar e filtrar questões" onSubmit={(e) => e.preventDefault()}>
        <label className="bq-field bq-search" htmlFor="f-q"><span>Buscar por assunto</span><input id="f-q" type="search" value={filters.search} onChange={(e) => change({ search: e.target.value })} placeholder="Ex.: juros, mol, genética" /></label>
        {select("f-d", "Disciplina", filters.discipline, (v) => change({ discipline: v as "" | Discipline, topic: "" }), [["", "Todas"], ...(Object.keys(disciplineLabel) as Discipline[]).map((d): [string, string] => [d, disciplineLabel[d]])])}
        {select("f-t", "Tópico", filters.topic, (v) => change({ topic: v }), [["", "Todos"], ...topics.map((t): [string, string] => [t, t])])}
        <button ref={toggleRef} type="button" className="bq-filters-btn" aria-expanded={panel} aria-controls="bq-panel" onClick={() => setPanel((value) => !value)}>
          Filtros{advancedCount ? <b aria-label={`${advancedCount} ativos`}>{advancedCount}</b> : null}
        </button>
      </form>

      {panel ? (
        <div id="bq-panel" className="bq-panel" role="group" aria-label="Filtros avançados">
          {select("f-o", "Origem", filters.origin, (v) => change({ origin: v as Filters["origin"] }), [["", "Todas"], ["oficial", "Oficial do Enem"], ["autoral", "Autoral no estilo Enem"], ["adaptada", "Adaptada"]])}
          {years.length ? select("f-y", "Ano da prova", filters.year, (v) => change({ year: v }), [["", "Todos"], ...years.map((y): [string, string] => [String(y), String(y)])]) : null}
          {select("f-df", "Dificuldade", filters.difficulty, (v) => change({ difficulty: v as "" | Difficulty }), [["", "Todas"], ...(Object.keys(difficultyLabel) as Difficulty[]).map((d): [string, string] => [d, difficultyLabel[d]])])}
          {select("f-dur", "Duração", filters.duration, (v) => change({ duration: v as Filters["duration"] }), [["", "Qualquer"], ["curta", "Curta (até 2 min)"], ["media", "Média (3 min)"], ["longa", "Longa (4 min ou mais)"]])}
          {select("f-s", "Status", filters.status, (v) => change({ status: v as Filters["status"] }), (Object.keys(statusLabels) as (keyof typeof statusLabels)[]).map((k): [string, string] => [k, statusLabels[k]]))}
          <button type="button" className="bq-close" onClick={() => { setPanel(false); toggleRef.current?.focus(); }}>Fechar filtros</button>
        </div>
      ) : null}

      <div className="bq-status">
        {chips.length ? (
          <ul className="bq-chips" aria-label="Filtros ativos">
            {chips.map((chip) => <li key={chip.key}><button type="button" onClick={() => change(chip.clear)} aria-label={`Remover filtro: ${chip.label}`}>{chip.label} <span aria-hidden="true">×</span></button></li>)}
          </ul>
        ) : null}
        <p role="status" aria-live="polite" className="bq-count">{filtered.length ? `${filtered.length} ${filtered.length === 1 ? "questão" : "questões"}` : "Nenhuma questão"}<span> · de {questions.length} no acervo</span></p>
        <div className="bq-tools">
          {chips.length ? <button type="button" className="bq-link" onClick={() => setFilters({ ...emptyFilters })}>Limpar filtros</button> : null}
          <button type="button" className="bq-link" onClick={copyLink}>{copied ? "Link copiado" : "Copiar link desta seleção"}</button>
        </div>
      </div>

      {meta && !q ? <div className="op-card op-muted" role="status">{loadError || "Carregando a questão…"} {loadError ? <button type="button" className="op-btn" onClick={() => setLoaded((p) => ({ ...p }))}>Tentar de novo</button> : null}</div> : null}
      {q ? (
        <>
          <QuestionCard q={q} index={cursor} total={filtered.length} moduleTitle={moduleTitles[q.moduleId]} basePath={basePath} favorite={state.fav.includes(q.id)} later={state.later.includes(q.id)} attemptCount={state.attempts[q.id]?.n || 0} onToggle={toggle} onAnswered={answered} context={view === "erros" ? "erros" : "estudo"} />
          <div className="bq-pager">
            <button type="button" className="bq-nav" disabled={cursor === 0} onClick={() => go(cursor - 1)}>Anterior</button>
            {view === "erros" ? <button type="button" className="bq-link" aria-pressed={Boolean(state.reviewed[q.id])} onClick={() => markReviewed(q.id, !state.reviewed[q.id])}>{state.reviewed[q.id] ? "Revisado ✓ (desfazer)" : "Marcar como revisado"}</button> : null}
            {filtered.length > 5 ? (
              <label className="bq-jump" htmlFor="f-jump"><span>Ir para</span>
                <input id="f-jump" type="number" min={1} max={filtered.length} value={cursor + 1} onChange={(e) => { const n = Math.floor(Number(e.target.value)); if (Number.isFinite(n) && n >= 1 && n <= filtered.length) go(n - 1); }} />
              </label>
            ) : null}
            <button type="button" className="bq-nav bq-nav-next" disabled={cursor >= filtered.length - 1} onClick={() => go(cursor + 1)}>Próxima</button>
          </div>
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
