"use client";

import "katex/dist/katex.min.css";
import Link from "next/link";
import { useRef, useState } from "react";

export type PreviewQuestion = {
  statementHtml: string;
  options: { id: string; html: string }[];
  topic: string;
  originLabel: string;
};
type Result = { correct: boolean; answer: string; resolutionHtml: string; distractorHtml: string | null };

/**
 * Prévia opcional e sem cadastro: uma questão real do acervo. O gabarito só chega do servidor depois da tentativa.
 * É uma amostra: não mede domínio de conteúdo.
 */
export default function CampaignQuestionPreview({ question, ctaHref, title }: { question: PreviewQuestion; ctaHref: string; title: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const lock = useRef(false);

  async function submit() {
    if (!selected || lock.current || result) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/campanha/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ selected }) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data || typeof data.correct !== "boolean") throw new Error(data?.error || "Não foi possível corrigir agora. Tente novamente.");
      setResult(data as Result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível corrigir agora. Tente novamente.");
    } finally {
      lock.current = false; setBusy(false);
    }
  }

  return (
    <div className="cp-card" id="reta-final-questao">
      <p className="cp-eyebrow">Amostra · {question.originLabel} · {question.topic}</p>
      <h3 id="cp-preview-title">{title}</h3>
      <div className="cp-statement" dangerouslySetInnerHTML={{ __html: question.statementHtml }} />
      <div role="radiogroup" aria-labelledby="cp-preview-title" className="cp-options">
        {question.options.map((option) => {
          const isPicked = selected === option.id;
          const state = result ? (option.id === result.answer ? "is-correct" : isPicked ? "is-wrong" : "") : isPicked ? "is-picked" : "";
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isPicked}
              disabled={Boolean(result)}
              className={`cp-option ${state}`}
              data-analytics-event={started ? undefined : "campaign_preview_start"}
              onClick={() => { setStarted(true); setSelected(option.id); }}
            >
              <b aria-hidden="true">{option.id}</b>
              <span dangerouslySetInnerHTML={{ __html: option.html }} />
              {result && option.id === result.answer ? <i className="cp-flag">Resposta correta</i> : null}
              {result && isPicked && option.id !== result.answer ? <i className="cp-flag">Sua escolha</i> : null}
            </button>
          );
        })}
      </div>
      {!result ? (
        <div className="cp-actions">
          <button type="button" className="ref-button ref-button-primary" disabled={!selected || busy} onClick={submit} data-analytics-event="campaign_preview_answer">{busy ? "Corrigindo…" : "Responder"}</button>
          <span className="cp-note">Opcional, sem cadastro. Uma única questão de amostra.</span>
        </div>
      ) : null}
      {error ? <p className="cp-error" role="alert"><strong>Erro: </strong>{error}</p> : null}
      <div role="status" aria-live="polite">
        {result ? (
          <div className="cp-feedback">
            <p className="cp-feedback-title">{result.correct ? "Você acertou. Continue praticando com revisões e questões comentadas para o segundo dia." : "Veja como entender o raciocínio e revisar esse conceito antes da prova."}</p>
            <div className="cp-resolution"><strong>Comentário</strong><div dangerouslySetInnerHTML={{ __html: result.resolutionHtml }} />{!result.correct && result.distractorHtml ? <div className="cp-distractor" dangerouslySetInnerHTML={{ __html: result.distractorHtml }} /> : null}</div>
            <Link className="ref-button ref-button-primary" href={ctaHref} data-analytics-event="campaign_preview_cta">Conhecer a preparação completa</Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
