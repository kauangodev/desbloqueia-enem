"use client";

import { useMemo, useState } from "react";
import type { EssayTheme } from "../data/essay-themes";

type Props = {
  themes: EssayTheme[];
  value: string;
  onChange: (theme: EssayTheme) => void;
};

const categories = ["Todos", "Educação", "Tecnologia", "Meio ambiente", "Cidadania", "Ciência"] as const;

export default function EssayThemeLibrary({ themes, value, onChange }: Props) {
  const [category, setCategory] = useState<(typeof categories)[number]>("Todos");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(value);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return themes.filter((theme) => {
      const matchesCategory = category === "Todos" || theme.category === category;
      const haystack = `${theme.title} ${theme.summary} ${theme.category} ${theme.angles.join(" ")}`.toLocaleLowerCase("pt-BR");
      return matchesCategory && (!normalized || haystack.includes(normalized));
    });
  }, [category, query, themes]);

  return (
    <section className="essay-theme-library" aria-labelledby="essay-theme-title">
      <div className="essay-library-heading">
        <div>
          <span className="eyebrow">Biblioteca de repertório</span>
          <h3 id="essay-theme-title">Escolha um tema para começar</h3>
          <p>Textos-base curtos, ângulos de discussão e fonte para você pesquisar antes de escrever.</p>
        </div>
        <span className="essay-library-count">{filtered.length} temas</span>
      </div>
      <div className="essay-library-controls">
        <label className="sr-only" htmlFor="essay-theme-search">Buscar tema</label>
        <input id="essay-theme-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por tema ou palavra-chave" />
        <div className="essay-theme-filters" aria-label="Filtrar temas">
          {categories.map((item) => <button type="button" key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
      </div>
      <div className="essay-theme-grid">
        {filtered.map((theme) => {
          const selected = theme.id === value;
          const expanded = theme.id === openId;
          return (
            <article className={`essay-theme-card ${selected ? "selected" : ""}`} key={theme.id}>
              <button type="button" className="essay-theme-select" onClick={() => { setOpenId(theme.id); onChange(theme); }} aria-pressed={selected}>
                <span className="essay-theme-category">{theme.category}</span>
                <strong>{theme.title}</strong>
                <small>Atualizado em {theme.updatedAt}</small>
              </button>
              <button type="button" className="essay-theme-details" onClick={() => setOpenId(expanded ? "" : theme.id)} aria-expanded={expanded}>
                {expanded ? "Ocultar repertório" : "Ver repertório"}
              </button>
              {expanded && <div className="essay-theme-body">
                <p>{theme.summary}</p>
                <div className="essay-theme-angles">{theme.angles.map((angle) => <span key={angle}>{angle}</span>)}</div>
                <a href={theme.sourceUrl} target="_blank" rel="noreferrer">Consultar fonte: {theme.sourceLabel}</a>
              </div>}
            </article>
          );
        })}
      </div>
      {!filtered.length && <p className="essay-theme-empty">Nenhum tema encontrado. Tente outra palavra ou categoria.</p>}
      <p className="essay-library-note">A biblioteca é editorial e pode ser revisada mensalmente. Use os textos como ponto de partida e confirme dados específicos na fonte original.</p>
    </section>
  );
}

