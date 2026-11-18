"use client";

import Link from "next/link";
import { useState } from "react";

export type PreviewUnit = { id: string; title: string; objective: string; minutes: number; exampleHtml: string | null; tier: "gratis" | "essencial" };

const STAGES = [
  { id: "fundamento", label: "Fundamento", text: (u: PreviewUnit) => `Leitura curta do conceito (≈ ${u.minutes} min), com exemplo resolvido. ${u.objective}` },
  { id: "pratica", label: "Prática", text: () => "4 questões guiadas, com correção e explicação logo depois de cada resposta." },
  { id: "desafio", label: "Desafio", text: () => "5 questões no formato do Enem, sem pistas. Aprovado com 80% ou mais." },
  { id: "revisao", label: "Revisão", text: () => "3 questões que voltam em 1, 3 e 7 dias, para o conteúdo ficar." },
] as const;

/**
 * Prévia navegável da Trilha: o visitante troca de unidade e de etapa e vê o que acontece em cada uma, com uma questão real
 * do acervo na prática e no desafio. É uma PRÉVIA: não mostra progresso de ninguém e não grava nada.
 */
export default function TrilhaPreview({ units, signupHref }: { units: PreviewUnit[]; signupHref: string | null }) {
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const [stage, setStage] = useState<(typeof STAGES)[number]["id"]>("fundamento");
  const unit = units.find((u) => u.id === unitId) ?? units[0];
  if (!unit) return null;
  const current = STAGES.find((s) => s.id === stage)!;
  const showExample = (stage === "pratica" || stage === "desafio") && unit.exampleHtml;
  return (
    <div className="s-tp" aria-label="Prévia da Trilha">
      <p className="s-tp-label"><b>Prévia da Trilha</b> · exemplo com unidades reais, sem progresso de aluno</p>
      <div className="s-tp-units" role="group" aria-label="Unidade">
        {units.map((u) => (
          <button key={u.id} type="button" className="s-tp-unit" aria-pressed={u.id === unit.id} onClick={() => { setUnitId(u.id); setStage("fundamento"); }}>
            <span>{u.title}</span>
            <small>{u.tier === "gratis" ? "Grátis" : "Essencial"}</small>
          </button>
        ))}
      </div>
      <ol className="s-tp-stages" aria-label={`Etapas da unidade ${unit.title}`}>
        {STAGES.map((s, i) => (
          <li key={s.id}>
            <button type="button" aria-current={s.id === stage ? "step" : undefined} onClick={() => setStage(s.id)}><span aria-hidden="true">{i + 1}</span>{s.label}</button>
          </li>
        ))}
      </ol>
      <div className="s-tp-panel" role="region" aria-live="polite" aria-label={`${current.label} · ${unit.title}`}>
        <h3>{current.label}: {unit.title}</h3>
        <p>{current.text(unit)}</p>
        {showExample ? <div className="s-tp-example"><small>Exemplo real do acervo</small><div dangerouslySetInnerHTML={{ __html: unit.exampleHtml! }} /></div> : null}
        {signupHref && unit.tier === "gratis" ? <Link className="s-btn" href={signupHref} data-signup="trilha">Começar esta unidade grátis</Link> : null}
        {!signupHref || unit.tier !== "gratis" ? <p className="s-tp-note">{unit.tier === "gratis" ? "" : "Esta unidade faz parte do Essencial."}</p> : null}
      </div>
    </div>
  );
}