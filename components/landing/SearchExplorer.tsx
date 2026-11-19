"use client";

import Link from "next/link";
import { useId, useState } from "react";

export type SearchItem = { label: string; kind: string; href: string };

const norm = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/**
 * "O que você quer estudar hoje?": busca no catálogo PÚBLICO (disciplinas e unidades da Trilha). Mostra onde o assunto está e o próximo passo;
 * a intenção segue no destino do cadastro. Sem resultado, explica a cobertura atual e oferece uma alternativa válida.
 */
export default function SearchExplorer({ items, fallbackHref }: { items: SearchItem[]; fallbackHref: string }) {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const inputId = useId();
  const needle = norm(submitted ?? "");
  const results = submitted === null ? [] : needle ? items.filter((item) => norm(`${item.label} ${item.kind}`).includes(needle)) : items.slice(0, 6);
  return (
    <div className="v2-search">
      <h2 id="v2-search-title">O que você quer estudar hoje?</h2>
      <form role="search" aria-labelledby="v2-search-title" onSubmit={(event) => { event.preventDefault(); setSubmitted(query); }}>
        <label htmlFor={inputId} className="sr-only">Busque por disciplina ou assunto</label>
        <span className="v2-search-field">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6" /><path d="m15 15 5 5" /></svg>
          <input id={inputId} type="search" name="q" value={query} maxLength={60} autoComplete="off" enterKeyHint="search" placeholder="Busque por disciplina ou assunto" onChange={(event) => setQuery(event.target.value)} />
        </span>
        <button type="submit" className="v2-btn">Explorar</button>
      </form>
      <div className="v2-search-results" role="status" aria-live="polite">
        {submitted === null ? null : results.length ? (
          <>
            <p>{needle ? `${results.length} resultado${results.length > 1 ? "s" : ""} para “${submitted.trim()}”` : "Por onde começar"}</p>
            <ul>{results.map((item) => (<li key={item.label}><Link href={item.href}><b>{item.label}</b><small>{item.kind}</small></Link></li>))}</ul>
          </>
        ) : (
          <p>Ainda não temos “{submitted.trim()}” na trilha. Hoje a GoDev cobre Matemática e Ciências da Natureza. <Link href={fallbackHref}>Veja por onde começar</Link>.</p>
        )}
      </div>
    </div>
  );
}
