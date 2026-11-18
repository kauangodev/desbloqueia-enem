"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "../icons";
import { ApiError, post } from "./client";
import type { Correction, PublicQuestion } from "../../lib/operacao/types";

type Stage = "pratica" | "desafio" | "teste" | "revisao";
type SessionInfo = { id: string; unitId: string; stage: Stage; total: number; cursor: number; answers: Record<string, string>; finished: boolean; repeated: number };
type Started = { session: SessionInfo; questions: PublicQuestion[]; corrections: Record<string, Correction> };
type Finished = { result: { correct: number; total: number; blank: number; passed: boolean }; corrections: Correction[]; mastery: string; alreadyFinished: boolean };

const stageText: Record<Stage, { label: string; intro: string; criterion: (n: number) => string }> = {
  pratica: { label: "Prática guiada", intro: "Você vê a correção e o raciocínio depois de cada resposta.", criterion: (): string => "Responda todas para concluir." },
  desafio: { label: "Desafio ENEM", intro: "A correção aparece só na entrega. Questão em branco vale zero.", criterion: (n) => `Meta: ${Math.ceil(n * 0.8)} de ${n}.` },
  teste: { label: "Teste de avanço", intro: "Valida esta unidade se você já conhece o conteúdo. A correção aparece só na entrega.", criterion: (n) => `Meta: ${Math.ceil(n * 0.8)} de ${n}.` },
  revisao: { label: "Revisão", intro: "Revisão curta, agendada para fixar o conteúdo. A correção aparece só na entrega.", criterion: (n) => `Meta: ${Math.ceil(n * (2 / 3))} de ${n}.` },
};

/**
 * Jogo de uma etapa da Trilha. O servidor decide itens, ordem, gabarito e resultado; aqui só se renderiza e se envia a escolha.
 * Falha de rede nunca perde a seleção: o botão fica disponível para tentar de novo e o que já foi salvo continua salvo.
 */
export default function StagePlayer({ unitId, stage, unitTitle, unitHref, moduleHref, trilhaHref, errosHref }: { unitId: string; stage: Stage; unitTitle: string; unitHref: string; moduleHref: string; trilhaHref: string; errosHref: string }) {
  const [phase, setPhase] = useState<"loading" | "error" | "play" | "result">("loading");
  const [error, setError] = useState("");
  const [data, setData] = useState<Started | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [struck, setStruck] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [finished, setFinished] = useState<Finished | null>(null);
  const [note, setNote] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const info = stageText[stage];

  const load = useCallback(async () => {
    setPhase("loading"); setError("");
    try {
      const started = await post<Started>({ action: "start", unitId, stage });
      setData(started);
      const firstOpen = started.questions.findIndex((q) => !started.session.answers[q.id]);
      setIndex(started.session.finished ? 0 : firstOpen === -1 ? Math.min(started.session.cursor, started.questions.length - 1) : firstOpen);
      setSelected(""); setStruck({}); setFinished(null); setPhase("play");
    } catch (e) { setError(e instanceof ApiError || e instanceof Error ? e.message : "Não foi possível abrir a etapa."); setPhase("error"); }
  }, [unitId, stage]);
  useEffect(() => { void load(); }, [load]);

  const q = data?.questions[index];
  const saved = q ? data?.session.answers[q.id] : undefined;
  const correction = q ? data?.corrections[q.id] : undefined;
  const answeredCount = data ? Object.keys(data.session.answers).length : 0;
  const total = data?.session.total ?? 0;

  useEffect(() => { if (!q) return; try { setNote(window.sessionStorage.getItem(`godev-trilha-pad:${q.id}`) || ""); } catch { setNote(""); } setSelected(""); setMessage(""); headingRef.current?.focus({ preventScroll: true }); }, [q]);
  const saveNote = (value: string) => { setNote(value); if (!q) return; try { if (value) window.sessionStorage.setItem(`godev-trilha-pad:${q.id}`, value); else window.sessionStorage.removeItem(`godev-trilha-pad:${q.id}`); } catch { /* sem armazenamento: o texto fica na tela */ } };

  async function confirm() {
    if (!data || !q || !selected || busy || saved) return;
    setBusy(true); setMessage("");
    try {
      const result = await post<{ duplicate: boolean; selected: string; correction?: Correction }>({ action: "answer", unitId, stage, sessionId: data.session.id, questionId: q.id, selected });
      setData((current) => current ? { ...current, session: { ...current.session, answers: { ...current.session.answers, [q.id]: result.selected } }, corrections: result.correction ? { ...current.corrections, [q.id]: result.correction } : current.corrections } : current);
    } catch (e) { setMessage(`${e instanceof Error ? e.message : "Falha ao salvar."} Sua escolha continua marcada: toque em “Confirmar” para tentar de novo.`); }
    finally { setBusy(false); }
  }

  async function finish() {
    if (!data || busy) return;
    setBusy(true); setMessage("");
    try {
      const result = await post<Finished>({ action: "finish", unitId, stage, sessionId: data.session.id });
      setFinished(result); setPhase("result");
    } catch (e) { setMessage(`${e instanceof Error ? e.message : "Não foi possível entregar."} Suas respostas continuam salvas; tente de novo.`); }
    finally { setBusy(false); }
  }

  const goTo = (next: number) => { if (!data) return; const clamped = Math.max(0, Math.min(next, total - 1)); setIndex(clamped); void post({ action: "cursor", unitId, stage, sessionId: data.session.id, cursor: clamped }).catch(() => undefined); };

  // Atalhos: só no contexto do exercício e nunca em campos de texto.
  const live = useRef({ confirm, selected, saved, q, busy });
  useEffect(() => { live.current = { confirm, selected, saved, q, busy }; });
  useEffect(() => {
    if (phase !== "play") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || ["TEXTAREA", "SELECT", "INPUT"].includes(target.tagName) && (target as HTMLInputElement).type !== "radio")) return;
      const l = live.current;
      if (!l.q || l.saved || l.busy) return;
      const key = event.key.toLowerCase();
      if (l.q.options.some((o) => o.id.toLowerCase() === key)) { setSelected(key.toUpperCase()); event.preventDefault(); }
      else if (event.key === "Enter" && l.selected) { void l.confirm(); event.preventDefault(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phase]);

  if (phase === "loading") return <p className="tr-note" role="status">Abrindo a etapa…</p>;
  if (phase === "error" || !data) {
    return (
      <section className="as-card" role="alert">
        <h2>Esta etapa não abriu</h2>
        <p>{error}</p>
        <div className="op-q-foot"><button type="button" className="as-btn" onClick={() => void load()}>Tentar de novo</button><Link className="as-btn" href={unitHref}>Voltar à unidade</Link></div>
      </section>
    );
  }

  if (phase === "result" && finished) {
    const r = finished.result;
    const byId = new Map(data.questions.map((x) => [x.id, x]));
    const passed = r.passed;
    return (
      <div className="tr-stage">
        <section className={`as-card tr-result ${passed ? "is-ok" : "is-bad"}`} aria-labelledby="tr-res">
          <p className="tr-eyebrow">{info.label} · {unitTitle}</p>
          <h2 id="tr-res">{stage === "pratica" ? "Prática concluída" : passed ? "Objetivo alcançado" : "Ainda não foi desta vez"}</h2>
          <p className="op-big">{r.correct} de {r.total} <span>certas</span></p>
          <p className="as-muted">{stage === "pratica" ? "Concluir a prática libera o desafio. Os erros foram para o seu caderno." : `${info.criterion(r.total)} ${r.blank ? `${r.blank} em branco (valem zero). ` : ""}${passed ? "Resultado registrado." : "Você pode ver a resolução e tentar de novo com questões equivalentes."}`}</p>
          {finished.mastery === "concluida" || finished.mastery === "validada" ? <p className="tr-badge">{finished.mastery === "validada" ? "Unidade validada pelo teste de avanço" : "Unidade concluída"}. Uma revisão curta foi agendada para fixar.</p> : null}
          {data.session.repeated > 0 ? <p className="tr-note">{data.session.repeated} {data.session.repeated === 1 ? "questão" : "questões"} desta etapa já tinham aparecido: o acervo desta unidade é limitado.</p> : null}
          <div className="op-q-foot">
            {stage === "pratica" ? <Link className="as-btn as-btn-primary" href={`${unitHref}/desafio`}>Ir ao desafio</Link> : <Link className="as-btn as-btn-primary" href={unitHref}>{passed ? "Continuar na trilha" : "Voltar à unidade"}</Link>}
            {!passed && stage !== "pratica" ? <button type="button" className="as-btn" onClick={() => void load()}>Tentar novo {stage === "teste" ? "teste" : stage === "revisao" ? "revisão" : "desafio"}</button> : null}
            <Link className="as-btn" href={errosHref}>Refazer meus erros</Link>
            <Link className="as-btn" href={moduleHref}>Rever o conteúdo</Link>
            <Link className="as-btn" href={trilhaHref}>Mapa da trilha</Link>
          </div>
        </section>
        {finished.corrections.length ? (
          <section className="as-card" aria-labelledby="tr-corr">
            <h2 id="tr-corr">Correção comentada</h2>
            <div className="op-stack">
              {finished.corrections.map((c, i) => {
                const item = byId.get(c.questionId);
                return (
                  <details key={c.questionId} className={`op-correction ${c.selected === null ? "is-blank" : c.correct ? "is-ok" : "is-bad"}`} open={c.selected !== null && !c.correct}>
                    <summary>Questão {i + 1} — {c.selected === null ? "em branco" : c.correct ? "acertou" : `errou (marcou ${c.selected}; certa: ${c.answer})`}</summary>
                    <div className="op-rich" dangerouslySetInnerHTML={{ __html: item?.statementHtml || "" }} />
                    {c.distractorHtml ? <div className="op-rich"><strong>Sobre a sua alternativa: </strong><span dangerouslySetInnerHTML={{ __html: c.distractorHtml }} /></div> : null}
                    <div className="op-rich" dangerouslySetInnerHTML={{ __html: c.resolutionHtml }} />
                    <p className="op-misconception"><strong>Erro comum:</strong> {c.misconception}</p>
                  </details>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  if (!q) return <section className="as-card"><p>Esta etapa não tem questões publicadas.</p><Link className="as-btn" href={unitHref}>Voltar</Link></section>;
  const lastIndex = total - 1;
  const allAnswered = answeredCount >= total;
  const blank = total - answeredCount;

  return (
    <div className="tr-stage">
      <header className="tr-stage-head">
        <p className="tr-eyebrow">{info.label} · {unitTitle}</p>
        <div className="tr-progress"><strong>Questão {index + 1} de {total}</strong><span>{answeredCount} respondida{answeredCount === 1 ? "" : "s"} · {info.criterion(total)}</span></div>
        <span className="op-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answeredCount} aria-label="Progresso da etapa"><i style={{ width: `${(answeredCount / Math.max(total, 1)) * 100}%` }} /></span>
        <p className="tr-note">{info.intro}</p>
        <Link className="tr-exit" href={unitHref}>Salvar e sair</Link>
      </header>

      <article className="as-card op-question" aria-labelledby="tr-q">
        <p className="bq-meta"><strong>{q.topic}</strong><span>{q.originLabel}</span>{q.officialRef ? <span>{q.officialRef}</span> : null}</p>
        <h3 id="tr-q" ref={headingRef} tabIndex={-1} className="op-q-title">Questão {index + 1}</h3>
        <div className="op-rich" dangerouslySetInnerHTML={{ __html: q.statementHtml }} />
        {q.figure ? <figure className="op-figure"><img src={q.figure.src} alt={q.figure.alt} loading="lazy" />{q.figure.longDescription ? <details><summary>Descrição detalhada da imagem</summary><p>{q.figure.longDescription}</p></details> : null}</figure> : null}
        <div role="radiogroup" aria-label="Alternativas" className="op-options">
          {q.options.map((o) => {
            const chosen = saved ?? selected;
            const state = correction ? (o.id === correction.answer ? "is-correct" : o.id === saved ? "is-wrong" : "") : saved ? (o.id === saved ? "is-selected" : "") : o.id === selected ? "is-selected" : struck[o.id] ? "is-struck" : "";
            return (
              <div key={o.id} className="op-option-row">
                <label className={`op-option ${state}`}>
                  <input type="radio" name={`tr-${q.id}`} value={o.id} checked={chosen === o.id} disabled={Boolean(saved) || busy} onChange={() => setSelected(o.id)} />
                  <span className="op-letter" aria-hidden="true">{o.id}</span>
                  <span className="op-option-text"><span className="op-sr">Alternativa {o.id}: </span><span dangerouslySetInnerHTML={{ __html: o.html }} />{correction && o.id === correction.answer ? <b className="op-sr"> (correta)</b> : null}</span>
                </label>
                {!saved ? <button type="button" className="op-cut" aria-pressed={Boolean(struck[o.id])} aria-label={struck[o.id] ? `Voltar a alternativa ${o.id}` : `Eliminar a alternativa ${o.id}`} title="Eliminar alternativa" onClick={() => { setStruck((c) => ({ ...c, [o.id]: !c[o.id] })); if (selected === o.id) setSelected(""); }}><Icon name="x" size={16} aria-hidden="true" /></button> : null}
              </div>
            );
          })}
        </div>

        {!saved ? (
          <>
            <details className="op-pad"><summary>Rascunho</summary><label className="op-sr" htmlFor="tr-pad">Rascunho desta questão</label><textarea id="tr-pad" value={note} maxLength={2000} placeholder="Faça contas aqui. Fica só neste aparelho." onChange={(e) => saveNote(e.target.value)} /></details>
            <p className="op-keys">Atalhos: <kbd>A</kbd>–<kbd>E</kbd> escolhem e <kbd>Enter</kbd> confirma.</p>
            <div className="op-q-foot"><button type="button" className="op-btn op-btn-primary" disabled={!selected || busy} onClick={() => void confirm()}>{busy ? "Salvando…" : stage === "pratica" ? "Confirmar resposta" : "Salvar resposta"}</button></div>
          </>
        ) : null}
        {saved && !correction ? <p className="tr-note" role="status">Resposta {saved} salva. A correção aparece na entrega.</p> : null}
        {message ? <p className="op-error" role="alert">{message}</p> : null}

        {correction ? (
          <div className={`op-feedback ${correction.correct ? "is-ok" : "is-bad"}`} role="status">
            <h4>{correction.correct ? "Correto!" : `Não foi dessa vez. A correta é a alternativa ${correction.answer}.`}</h4>
            {correction.distractorHtml ? <div className="op-rich op-distractor"><strong>Por que a sua escolha não serve: </strong><span dangerouslySetInnerHTML={{ __html: correction.distractorHtml }} /></div> : null}
            <details open={!correction.correct}><summary>Resolução passo a passo</summary><div className="op-rich" dangerouslySetInnerHTML={{ __html: correction.resolutionHtml }} /></details>
            <p className="op-misconception"><Icon name="triangle-alert" size={16} aria-hidden="true" /> <span><strong>Erro comum:</strong> {correction.misconception}</span></p>
          </div>
        ) : null}
      </article>

      <div className="bq-pager">
        <button type="button" className="bq-nav" disabled={index === 0} onClick={() => goTo(index - 1)}>Anterior</button>
        {stage !== "pratica" && index < lastIndex ? <span className="tr-note">Você pode voltar às questões antes de entregar.</span> : null}
        {index < lastIndex ? <button type="button" className="bq-nav bq-nav-next" onClick={() => goTo(index + 1)}>Próxima</button> : (
          <button type="button" className="as-btn as-btn-primary bq-nav-next" disabled={busy || (stage === "pratica" && !allAnswered)} onClick={() => void finish()}>
            {busy ? "Entregando…" : stage === "pratica" ? "Concluir prática" : "Entregar"}
          </button>
        )}
      </div>
      {index === lastIndex && stage !== "pratica" && blank > 0 ? <p className="tr-note" role="note">{blank} {blank === 1 ? "questão em branco vale" : "questões em branco valem"} zero. Volte para respondê-las, se quiser.</p> : null}
    </div>
  );
}
