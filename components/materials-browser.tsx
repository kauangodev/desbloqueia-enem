"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Material } from "./resources";

type View = "cards" | "list";

const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const VIEW_KEY = "godev-materials-view";

function syncUrl(params: Record<string, string>) {
  try {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([key, value]) => (value ? url.searchParams.set(key, value) : url.searchParams.delete(key)));
    window.history.replaceState(window.history.state, "", url.toString());
  } catch {
    /* a URL é apenas um recurso de contexto; a navegação não depende dela */
  }
}

export default function MaterialsBrowser({
  items,
  controls = false,
  defaultView = "cards",
  initialQuery = "",
}: {
  items: Material[];
  controls?: boolean;
  defaultView?: View;
  initialQuery?: string;
}) {
  const [view, setView] = useState<View>(defaultView);
  const [category, setCategory] = useState("Todos");
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    if (!controls) return;
    try {
      const saved = window.localStorage.getItem(VIEW_KEY);
      if (saved === "cards" || saved === "list") setView(saved);
      else if (window.matchMedia("(max-width: 640px)").matches) setView("list");
    } catch {
      /* armazenamento indisponível: mantém a visão padrão */
    }
    const area = new URLSearchParams(window.location.search).get("area");
    if (area) setCategory(area);
  }, [controls]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => counts.set(item.category, (counts.get(item.category) || 0) + 1));
    return [...counts.entries()];
  }, [items]);

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    return items.filter((item) => {
      if (category !== "Todos" && item.category !== category) return false;
      if (!needle) return true;
      return normalize(`${item.title} ${item.description} ${item.category}`).includes(needle);
    });
  }, [items, category, query]);

  const filtersActive = category !== "Todos" || query.trim() !== "";

  function chooseCategory(next: string) {
    setCategory(next);
    syncUrl({ area: next === "Todos" ? "" : next });
  }
  function chooseView(next: View) {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* sem persistência */
    }
  }
  function clearFilters() {
    setCategory("Todos");
    setQuery("");
    syncUrl({ area: "", q: "" });
  }

  if (!items.length) {
    return (
      <div className="empty-state">
        <h2>Seu acervo está sendo preparado.</h2>
        <p>Os materiais publicados para seu plano aparecerão aqui. Se você já comprou e ainda não vê nada, fale com o atendimento.</p>
      </div>
    );
  }

  return (
    <div className="materials-browser">
      {controls && (
        <div className="materials-toolbar">
          <div className="materials-chips" role="group" aria-label="Filtrar por área">
            <button type="button" aria-pressed={category === "Todos"} onClick={() => chooseCategory("Todos")}>
              Todos <span>{items.length}</span>
            </button>
            {categories.map(([name, count]) => (
              <button key={name} type="button" aria-pressed={category === name} onClick={() => chooseCategory(name)}>
                {name} <span>{count}</span>
              </button>
            ))}
          </div>
          <div className="materials-view" role="group" aria-label="Modo de exibição">
            <button type="button" aria-pressed={view === "cards"} onClick={() => chooseView("cards")}>Cards</button>
            <button type="button" aria-pressed={view === "list"} onClick={() => chooseView("list")}>Lista</button>
          </div>
        </div>
      )}

      {(controls || filtersActive) && (
        <div className="materials-status" aria-live="polite">
          <span>{filtersActive ? `${filtered.length} de ${items.length} materiais` : `${items.length} materiais`}</span>
          {query.trim() && <span className="materials-tag">Busca: “{query.trim()}”</span>}
          {category !== "Todos" && <span className="materials-tag">{category}</span>}
          {filtersActive && filtered.length > 0 && (
            <button type="button" className="materials-clear" onClick={clearFilters}>Limpar filtros</button>
          )}
        </div>
      )}

      {filtered.length ? (
        <div className="resource-grid" data-view={view}>
          {filtered.map((item) => (
            <Link className="resource" href={`/aluno/ler/${item.id}`} key={item.id}>
              <div className="resource-cover">
                <Image src={item.cover} width={200} height={283} alt={view === "list" ? "" : `Capa: ${item.title}`} />
              </div>
              <div className="resource-info">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <small>{item.category} · {item.pages} páginas</small>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Nenhum material corresponde a esta busca.</h2>
          <p>Ajuste os filtros ou limpe a busca para ver todos os {items.length} materiais liberados para o seu plano.</p>
          <button type="button" className="button secondary" onClick={clearFilters}>Limpar filtros</button>
        </div>
      )}
    </div>
  );
}
