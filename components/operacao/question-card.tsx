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

  const [struck, setStruck] = useState<Record<string, boolean>>({});
  const [elapsed, setElapsed] = useState(0);
  const [note, setNote] = useState("");
  const answeredRef = useRef(false);
  const selectedRef = useRef("");
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  useEffect(() => { setSelected(""); setResult(null); setError(""); setBusy(false); sending.current = false; setStruck({}); setElapsed(0); }, [q.id]);
  useEffect(() => { if (result) feedbackRef.current?.focus(); }, [result]);
  useEffect(() => { answeredRef.current = Boolean(result); }, [result]);

  // Ritmo: tempo na questão até confirmar. Só de apoio, nada é enviado nem guardado no servidor.
  useEffect(() => {
    const id = setInterval(() => { if (!answeredRef.current && document.visibilityState === "visible") setElapsed((value) => value + 1); }, 1000);
    return () => clearInterval(id);
  }, [q.id]);

  // Rascunho por questão, só neste aparelho e nesta aba (sessionStorage); falhas de armazenamento são ignoradas.
  useEffect(() => {
    try { setNote(window.sessionStorage.getItem(`godev-pad:${q.id}`) || ""); } catch { setNote(""); }
  }, [q.id]);
  const saveNote = (value: string) => {
    setNote(value);
    try { if (value) window.sessionStorage.setItem(`godev-pad:${q.id}`, value); else window.sessionStorage.removeItem(`godev-pad:${q.id}`); } catch { /* sem armazenamento: o texto fica só na tela */ }
  };

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

  // Atalhos: A–E escolhem a alternativa; Enter confirma. Ignorados enquanto o foco está num campo de texto.
  const confirmRef = useRef(confirm);
  useEffect(() => { confirmRef.current = confirm; });
  useEffect(() => {
    if (answered) return;
    const ids = q.options.map((option) => option.id.toLowerCase());
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) && (target as HTMLInputElement).type !== "radio")) return;
      const key = event.key.toLowerCase();
      if (ids.includes(key)) { setSelected(key.toUpperCase()); event.preventDefault(); }
      else if (event.key === "Enter" && selectedRef.current) { void confirmRef.current(); event.preventDefault(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [answered, q.options]);
  const clock = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;

  return (
    <article className="op-card op-question" aria-labelledby={`${group}-t`}>
      <header className="bq-qhead">
        <p className="bq-meta">
          <strong>{disciplineLabel[q.discipline]}</strong>
          <span>{q.topic}</span>
          <span className={`bq-origin bq-origin-${q.origin}`}>{q.originLabel}</span>
          <span>{difficultyLabel[q.difficulty]}</span>
          <span>≈ {q.minutes} min</span>
        </p>
        <div className="bq-actions">
          <button type="button" className={`bq-act ${favorite ? "is-on" : ""}`} aria-pressed={favorite} title="Favoritar" onClick={() => onToggle("fav", q.id)}><Icon name="star" size={18} aria-hidden="true" /><span>{favorite ? "Favorita" : "Favoritar"}</span></button>
          <button type="button" className={`bq-act ${later ? "is-on" : ""}`} aria-pressed={later} title="Revisar depois" onClick={() => onToggle("later", q.id)}><Icon name="bookmark" size={18} aria-hidden="true" /><span>{later ? "Marcada para revisar" : "Revisar depois"}</span></button>
        </div>
      </header>      <h3 id={`${group}-t`} className="op-q-title">{index !== undefined && total ? `Questão ${index + 1} de ${total}` : "Questão"}{q.officialRef ? <small> · {q.officialRef}</small> : null}</h3>
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
          const state = answered ? (option.id === right ? "is-correct" : option.id === selected ? "is-wrong" : "") : option.id === selected ? "is-selected" : struck[option.id] ? "is-struck" : "";
          return (
            <div key={option.id} className="op-option-row">
              <label className={`op-option ${state}`}>
                <input type="radio" name={group} value={option.id} checked={selected === option.id} disabled={answered || busy} onChange={() => setSelected(option.id)} />
                <span className="op-letter" aria-hidden="true">{option.id}</span>
                <span className="op-option-text"><span className="op-sr">Alternativa {option.id}: </span><span dangerouslySetInnerHTML={{ __html: option.html }} />{answered && option.id === right ? <b className="op-sr"> (correta)</b> : null}</span>
              </label>
              {!answered ? (
                <button type="button" className="op-cut" aria-pressed={Boolean(struck[option.id])} aria-label={struck[option.id] ? `Voltar a alternativa ${option.id}` : `Eliminar a alternativa ${option.id}`} title="Eliminar alternativa" disabled={busy} onClick={() => { setStruck((current) => ({ ...current, [option.id]: !current[option.id] })); if (selected === option.id) setSelected(""); }}>
                  <Icon name="x" size={16} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      {!answered ? (
        <>
          <div className="op-q-tools">
            <span className="op-pace" role="timer" aria-label={`Tempo nesta questão: ${clock}`}><Icon name="timer" size={14} /> {clock}</span>
            <details className="op-pad">
              <summary>Rascunho</summary>
              <label className="op-sr" htmlFor={`${group}-pad`}>Rascunho desta questão</label>
              <textarea id={`${group}-pad`} value={note} maxLength={2000} placeholder="Faça contas e anotações aqui. Ficam só neste aparelho." onChange={(event) => saveNote(event.target.value)} />
            </details>
          </div>
          <p className="op-keys">Atalhos: <kbd>A</kbd>–<kbd>E</kbd> escolhem a alternativa e <kbd>Enter</kbd> confirma. O “×” ao lado elimina uma alternativa.</p>
        </>
      ) : null}
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
