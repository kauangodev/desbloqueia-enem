"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "../icons";
import type { Correction, PublicQuestion } from "../../lib/operacao/types";
import { difficultyLabel, disciplineLabel } from "../../lib/operacao/types";
import { post } from "./client";

type Props = {
  q: PublicQuestion;
  index?: number;
  total?: number;
  moduleTitle?: string;
  basePath: string;
  favorite: boolean;
  later: boolean;
  attemptCount: number;
  onToggle: (kind: "fav" | "later", id: string) => void;
  onAnswered: (id: string, correct: boolean, firstTry: boolean) => void;
  context?: "estudo" | "erros";
};

type Result = { correction: Correction; firstTry: boolean; afterResolution: boolean };

export default function QuestionCard({ q, index, total, moduleTitle, basePath, favorite, later, attemptCount, onToggle, onAnswered, context = "estudo" }: Props) {
  const [selected, setSelected] = useState<string>("");
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const group = useId();
  const sending = useRef(false);

  useEffect(() => { setSelected(""); setResult(null); setError(""); setBusy(false); sending.current = false; }, [q.id]);
  useEffect(() => { if (result) feedbackRef.current?.focus(); }, [result]);

  async function confirm() {
    if (!selected || sending.current) return; // evita clique duplo
    sending.current = true; setBusy(true); setError("");
    try {
      const data = await post<Result>({ action: "answer", questionId: q.id, selected, context });
      setResult(data);
      onAnswered(q.id, data.correction.correct, data.firstTry);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível confirmar. Tente novamente.");
    } finally { sending.current = false; setBusy(false); }
  }

  const answered = Boolean(result);
  const right = result?.correction.answer;

  return (
    <article className="op-card op-question" aria-labelledby={`${group}-t`}>
      <header className="op-q-head">
        <div className="op-q-tags">
          <span className="op-tag">{disciplineLabel[q.discipline]}</span>
          <span className="op-tag op-tag-soft">{q.topic}</span>
          <span className={`op-tag op-tag-origin op-origin-${q.origin}`}>{q.originLabel}</span>
          <span className="op-tag op-tag-soft">{difficultyLabel[q.difficulty]}</span>
          <span className="op-tag op-tag-soft">≈ {q.minutes} min</span>
        </div>
        <div className="op-q-actions">
          <button type="button" className={`op-icon-btn ${favorite ? "is-on" : ""}`} aria-pressed={favorite} aria-label={favorite ? "Remover dos favoritos" : "Salvar nos favoritos"} title="Favoritar" onClick={() => onToggle("fav", q.id)}><Icon name="star" size={18} /></button>
          <button type="button" className={`op-icon-btn ${later ? "is-on" : ""}`} aria-pressed={later} aria-label={later ? "Remover de revisar depois" : "Marcar para revisar depois"} title="Revisar depois" onClick={() => onToggle("later", q.id)}><Icon name="bookmark" size={18} /></button>
        </div>
      </header>
      <h3 id={`${group}-t`} className="op-q-title">{index !== undefined && total ? `Questão ${index + 1} de ${total}` : "Questão"}{q.officialRef ? <small> · {q.officialRef}</small> : null}</h3>
      <div className="op-rich" dangerouslySetInnerHTML={{ __html: q.statementHtml }} />
      {q.figure ? (
        <figure className="op-figure">
          <button type="button" className="op-figure-btn" onClick={() => setZoom(true)} aria-label="Ampliar imagem"><img src={q.figure.src} alt={q.figure.alt} loading="lazy" /></button>
          {q.figure.longDescription ? <details><summary>Descrição detalhada da imagem</summary><p>{q.figure.longDescription}</p></details> : null}
          {zoom ? <div className="op-zoom" role="dialog" aria-modal="true" aria-label="Imagem ampliada" onClick={() => setZoom(false)}><img src={q.figure.src} alt={q.figure.alt} /><button type="button" className="op-btn">Fechar</button></div> : null}
        </figure>
      ) : null}
      <div role="radiogroup" aria-label="Alternativas" className="op-options">
        {q.options.map((option) => {
          const state = answered ? (option.id === right ? "is-correct" : option.id === selected ? "is-wrong" : "") : option.id === selected ? "is-selected" : "";
          return (
            <label key={option.id} className={`op-option ${state}`}>
              <input type="radio" name={group} value={option.id} checked={selected === option.id} disabled={answered || busy} onChange={() => setSelected(option.id)} />
              <span className="op-letter" aria-hidden="true">{option.id}</span>
              <span className="op-option-text"><span className="op-sr">Alternativa {option.id}: </span><span dangerouslySetInnerHTML={{ __html: option.html }} />{answered && option.id === right ? <b className="op-sr"> (correta)</b> : null}</span>
            </label>
          );
        })}
      </div>
      {!answered ? (
        <div className="op-q-foot">
          <button type="button" className="op-btn op-btn-primary" disabled={!selected || busy} onClick={confirm} data-analytics-event="operacao_confirm_answer">{busy ? "Verificando…" : "Confirmar resposta"}</button>
          {attemptCount > 0 ? <span className="op-muted">Você já tentou esta questão {attemptCount}×.</span> : null}
        </div>
      ) : null}
      {error ? <p className="op-error" role="alert">{error}</p> : null}
      {result ? (
        <div className={`op-feedback ${result.correction.correct ? "is-ok" : "is-bad"}`} ref={feedbackRef} tabIndex={-1} role="status">
          <h4>{result.correction.correct ? (result.afterResolution ? "Correto — mas já com a resolução vista" : "Correto de primeira!") : `Não foi dessa vez. A correta é a alternativa ${result.correction.answer}.`}</h4>
          {result.correction.correct && result.afterResolution ? <p className="op-muted">Este acerto não conta como “de primeira”, pois você já tinha visto a resolução.</p> : null}
          {result.correction.distractorHtml ? <div className="op-rich op-distractor"><strong>Por que a sua escolha não serve: </strong><span dangerouslySetInnerHTML={{ __html: result.correction.distractorHtml }} /></div> : null}
          <details open={!result.correction.correct}>
            <summary>Resolução passo a passo</summary>
            <div className="op-rich" dangerouslySetInnerHTML={{ __html: result.correction.resolutionHtml }} />
          </details>
          <p className="op-misconception"><Icon name="triangle-alert" size={16} /> <span><strong>Erro comum:</strong> {result.correction.misconception}</span></p>
          <div className="op-q-foot">
            <button type="button" className="op-btn" onClick={() => { setResult(null); setSelected(""); }}>Tentar novamente</button>
            {q.moduleId ? <Link className="op-btn op-btn-ghost" href={`${basePath}/materiais/${q.moduleId}`}>Rever: {moduleTitle || "módulo relacionado"}</Link> : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}
