"use client";
import { useMemo, useState } from "react";
export type Entry = {
  id: string;
  ano: number;
  dia: number;
  questao_referencia: number;
  area: string;
  fonte_provas_inep: string;
  consulta_resolucao_terceiros: string;
  gabarito_2025_azul: string;
  dificuldade_tri_2025: string;
  taxa_acerto_2025: string;
  disciplina_validada: string;
  assunto_validado: string;
  resolucao_autoral: string;
  estado_resolucao: string;
};
function safeUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" &&
      ["www.gov.br", "www.curso-objetivo.br", "xtri.online"].includes(
        u.hostname,
      )
      ? u.href
      : undefined;
  } catch {
    return undefined;
  }
}
export default function Library({ entries }: { entries: Entry[] }) {
  const [search, S] = useState(""),
    [year, Y] = useState(""),
    [area, A] = useState(""),
    [status, T] = useState(""),
    [page, P] = useState(0);
  const filtered = useMemo(
    () =>
      entries.filter(
        (r) =>
          (!year || String(r.ano) === year) &&
          (!area || r.area === area) &&
          (!status ||
            (status === "sol"
              ? r.resolucao_autoral
              : r.dificuldade_tri_2025)) &&
          (!search ||
            [
              r.id,
              r.area,
              r.assunto_validado,
              r.disciplina_validada,
              r.questao_referencia,
            ]
              .join(" ")
              .toLocaleLowerCase("pt-BR")
              .includes(search.toLocaleLowerCase("pt-BR"))),
      ),
    [entries, search, year, area, status],
  );
  const count = Math.max(1, Math.ceil(filtered.length / 24));
  return (
    <>
      <p className="status-message">
        1.800 posições de questões, fontes externas e sete resoluções autorais.
        Este índice não contém 1.800 explicações próprias. Os gabaritos de 2025
        se referem ao caderno azul.
      </p>
      <div className="filters">
        <input
          aria-label="Buscar questão"
          placeholder="Buscar assunto, número ou ID"
          value={search}
          onChange={(e) => {
            S(e.target.value);
            P(0);
          }}
        />
        <select
          aria-label="Ano"
          value={year}
          onChange={(e) => {
            Y(e.target.value);
            P(0);
          }}
        >
          <option value="">Todos os anos</option>
          {Array.from({ length: 10 }, (_, i) => 2025 - i).map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <select
          aria-label="Área"
          value={area}
          onChange={(e) => {
            A(e.target.value);
            P(0);
          }}
        >
          <option value="">Todas as áreas</option>
          {[...new Set(entries.map((r) => r.area))].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <select
          aria-label="Situação"
          value={status}
          onChange={(e) => {
            T(e.target.value);
            P(0);
          }}
        >
          <option value="">Todos os estados</option>
          <option value="sol">Resolução autoral</option>
          <option value="tri">TRI disponível</option>
        </select>
      </div>
      <p role="status">
        {filtered.length.toLocaleString("pt-BR")} referências encontradas
      </p>
      <div className="library-grid">
        {filtered.slice(page * 24, (page + 1) * 24).map((r) => (
          <article className="library-entry" key={r.id}>
            <small>
              {r.ano} · {r.dia}º dia · Questão {r.questao_referencia}
            </small>
            <h3>{r.area}</h3>
            <p>{r.assunto_validado || r.id}</p>
            <p>
              {r.gabarito_2025_azul
                ? `Gabarito Azul 2025: ${r.gabarito_2025_azul}`
                : "Gabarito pendente de conferência."}
              {r.dificuldade_tri_2025 &&
                ` · TRI: ${r.dificuldade_tri_2025} · Acerto: ${r.taxa_acerto_2025}%`}
            </p>
            <a
              href={safeUrl(r.fonte_provas_inep)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Prova oficial ↗
            </a>
            <a
              href={safeUrl(r.consulta_resolucao_terceiros)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Correção externa ↗
            </a>
            {r.resolucao_autoral ? (
              <div className="solution">
                <b>Resolução autoral disponível</b>
                <p>{r.resolucao_autoral}</p>
              </div>
            ) : (
              <p className="subtle">Resolução autoral pendente.</p>
            )}
          </article>
        ))}
      </div>
      {!filtered.length && <p>Nenhuma referência para estes filtros.</p>}
      <div className="pager">
        <button
          className="button secondary"
          disabled={!page}
          onClick={() => P(page - 1)}
        >
          Anterior
        </button>
        <span>
          {page + 1} / {count}
        </span>
        <button
          className="button secondary"
          disabled={page + 1 >= count}
          onClick={() => P(page + 1)}
        >
          Próxima
        </button>
      </div>
    </>
  );
}
