"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "../icons";
import { post, useOperacaoState } from "./client";

export type FormulaView = { id: string; discipline: string; disciplineLabel: string; topic: string; title: string; texHtml?: string; meaning: string; conditions: string; example: string; commonError: string; moduleId: string };

export default function FormulaLibrary({ cards, basePath, moduleTitles }: { cards: FormulaView[]; basePath: string; moduleTitles: Record<string, string> }) {
  const { state, patch, reload, error } = useOperacaoState();
  const [discipline, setDiscipline] = useState("");
  const [onlySaved, setOnlySaved] = useState(false);
  const [query, setQuery] = useState("");
  const list = useMemo(() => cards.filter((c) => (!discipline || c.discipline === discipline) && (!onlySaved || state?.formulas.includes(c.id)) && (!query || `${c.title} ${c.topic} ${c.meaning}`.toLowerCase().includes(query.toLowerCase()))), [cards, discipline, onlySaved, query, state]);
  async function toggle(id: string) {
    patch((s) => ({ ...s, formulas: s.formulas.includes(id) ? s.formulas.filter((x) => x !== id) : [...s.formulas, id] }));
    try { await post({ action: "toggle", kind: "formula", ref: id }); } catch { void reload(); }
  }
  return (
    <div className="op-stack">
      <form className="op-card op-filters" onSubmit={(e) => e.preventDefault()} aria-label="Filtros de fórmulas">
        <label className="op-field"><span>Buscar</span><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ex.: juros, resistores" /></label>
        <label className="op-field"><span>Disciplina</span><select value={discipline} onChange={(e) => setDiscipline(e.target.value)}><option value="">Todas</option><option value="matematica">Matemática</option><option value="fisica">Física</option><option value="quimica">Química</option><option value="biologia">Biologia</option></select></label>
        <label className="op-check op-inline"><input type="checkbox" checked={onlySaved} onChange={(e) => setOnlySaved(e.target.checked)} /><span>Só as salvas</span></label>
      </form>
      {error ? <p className="op-error" role="alert">{error}</p> : null}
      <p className="op-muted" role="status" aria-live="polite">{list.length} cartão(ões).</p>
      <div className="op-grid op-grid-2">
        {list.map((c) => {
          const saved = Boolean(state?.formulas.includes(c.id));
          return (
            <article key={c.id} className="op-card op-formula">
              <header className="op-q-head"><div className="op-q-tags"><span className="op-tag">{c.disciplineLabel}</span><span className="op-tag op-tag-soft">{c.topic}</span></div>
                <button type="button" className={`op-icon-btn ${saved ? "is-on" : ""}`} aria-pressed={saved} aria-label={saved ? `Remover “${c.title}” das salvas` : `Salvar “${c.title}”`} onClick={() => void toggle(c.id)}><Icon name="bookmark" size={18} /></button></header>
              <h3>{c.title}</h3>
              {c.texHtml ? <div className="op-tex" dangerouslySetInnerHTML={{ __html: c.texHtml }} /> : null}
              <p>{c.meaning}</p>
              <dl className="op-dl"><dt>Quando usar</dt><dd>{c.conditions}</dd><dt>Exemplo</dt><dd>{c.example}</dd><dt>Erro comum</dt><dd>{c.commonError}</dd></dl>
              <Link className="op-link" href={`${basePath}/materiais/${c.moduleId}`}>Ver no módulo: {moduleTitles[c.moduleId] || c.moduleId}</Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
