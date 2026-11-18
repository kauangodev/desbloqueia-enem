"use client";

import { useEffect, useRef, useState } from "react";
import type { DemoQuestion } from "./explorer-types";
import { features } from "../../lib/features";
import { trackBusiness } from "../../lib/funnel/client";

/**
 * Questão de exemplo jogável, no topo da landing: o visitante marca uma alternativa e vê a correção na hora,
 * com a resolução e o erro comum. Todo o conteúdo vem do servidor (amostra pública); nada é enviado de volta.
 */
export default function TryQuestion({ question }: { question: DemoQuestion }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [struck, setStruck] = useState<Record<string, boolean>>({});
  const feedback = useRef<HTMLDivElement>(null);
  const firstOption = useRef<HTMLOListElement>(null);
  const answered = picked !== null;
  const right = picked === question.answer;
  const why = question.options.find((option) => option.id === picked)?.why;

  useEffect(() => { if (answered) feedback.current?.focus({ preventScroll: true }); }, [answered]);

  // Ao tentar de novo, o foco volta à primeira alternativa (quem usa teclado ou leitor de tela não perde o lugar).
  const reset = () => { setPicked(null); setStruck({}); requestAnimationFrame(() => firstOption.current?.querySelector<HTMLButtonElement>(".s-try-pick")?.focus()); };
  const pick = (id: string) => {
    trackBusiness("demo_started", {}, { once: true });
    setPicked(id);
    trackBusiness("demo_answered", { correct: id === question.answer });
  };

  return (
    <div className="s-try" id="experimentar" role="group" aria-label="Questão de exemplo para testar">
      <header className="s-try-head">
        <span>{question.discLabel} · {question.topic}</span>
        <b className="s-try-chip">{answered ? (right ? "Acertou" : "Quase") : "Tente você"}</b>
      </header>
      <div className="s-try-stmt" dangerouslySetInnerHTML={{ __html: question.statementHtml }} />
      <ol className="s-try-opts" ref={firstOption}>
        {question.options.map((option) => {
          const state = answered ? (option.id === question.answer ? "is-right" : option.id === picked ? "is-wrong" : "") : struck[option.id] ? "is-struck" : "";
          return (
            <li key={option.id} className={state}>
              <button type="button" className="s-try-pick" disabled={answered} aria-pressed={picked === option.id} onClick={() => pick(option.id)}>
                <b aria-hidden="true">{option.id}</b>
                <span dangerouslySetInnerHTML={{ __html: option.html }} />
              </button>
              {!answered ? (
                <button type="button" className="s-try-cut" aria-pressed={Boolean(struck[option.id])} aria-label={struck[option.id] ? `Voltar a alternativa ${option.id}` : `Eliminar a alternativa ${option.id}`} title="Eliminar alternativa" onClick={() => { trackBusiness("demo_started", {}, { once: true }); setStruck((current) => ({ ...current, [option.id]: !current[option.id] })); }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false"><path d="M5 12h14" /></svg>
                </button>
              ) : null}
            </li>
          );
        })}
      </ol>
      {!answered ? <p className="s-try-hint">Escolha uma alternativa. Use o botão “−” para eliminar as que você descartar.</p> : null}
      <div className="s-try-feedback" ref={feedback} tabIndex={-1} role="status" aria-live="polite">
        {answered ? (
          <>
            <strong className={right ? "is-ok" : "is-bad"}>{right ? "Correto! Veja por quê." : `Não foi dessa vez. A correta é a ${question.answer}.`}</strong>
            {!right && why ? <p className="s-try-why">{why}</p> : null}
            <div className="s-try-sol" dangerouslySetInnerHTML={{ __html: question.resolutionHtml }} />
            <p className="s-try-mis"><b>Erro comum:</b> {question.misconception}</p>
            <div className="s-try-actions">
              <a className="s-btn" href={features.gratis ? "/entrar?modo=cadastro&redirect=%2Faluno%2Ftrilha" : "#ofertas"} data-analytics-event="try_question_cta" data-signup={features.gratis ? "demo" : undefined}>Praticar na GoDev</a>
              <button type="button" className="s-try-again" onClick={reset}>Tentar de novo</button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
