"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { post, useOperacaoState } from "../operacao/client";
import { deck, FLASH_INTERVALS, nextFlash, type FlashGrade, type FlashState } from "../../lib/operacao/flash";

export type FlashCardView = { id: string; disciplineLabel: string; topic: string; title: string; texHtml?: string; meaning: string; conditions: string; example: string; commonError: string; moduleId: string; moduleTitle: string };

const DAILY_LIMIT = 20;

/** Baralho do dia: a fila é montada uma vez, quando o progresso carrega, e não muda enquanto o aluno revisa. */
export default function FlashDeck({ cards, today, basePath }: { cards: FlashCardView[]; today: string; basePath: string }) {
  const { state, error, patch } = useOperacaoState();
  const [queue, setQueue] = useState<FlashCardView[] | null>(null);
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tally, setTally] = useState({ again: 0, good: 0, easy: 0 });
  const started = useRef(false);

  useEffect(() => {
    if (state && !started.current) {
      started.current = true;
      setQueue(deck(cards, (state.flash ?? {}) as Record<string, FlashState>, today, DAILY_LIMIT).queue);
    }
  }, [state, cards, today]);

  if (error && !state) return <p className="op-error" role="alert">{error}</p>;
  if (!queue || !state) return <p className="as-muted" role="status">Carregando seu baralho…</p>;

  const states = (state.flash ?? {}) as Record<string, FlashState>;
  const info = deck(cards, states, today, DAILY_LIMIT);
  const card = queue[index];

  if (!card) {
    const total = tally.again + tally.good + tally.easy;
    return (
      <section className="as-card" aria-labelledby="fc-end">
        <h2 id="fc-end">{total ? "Baralho do dia concluído" : "Nada para revisar agora"}</h2>
        <p className="as-muted">{total ? `${total} cartões revisados: ${tally.again} para rever amanhã, ${tally.good} acertados e ${tally.easy} fáceis.` : "Você está em dia. Volte amanhã: os cartões que você acertou voltam com intervalos maiores."}</p>
        <p className="as-muted">{cards.length - (info.due + info.fresh)} de {cards.length} cartões agendados para os próximos dias · {info.learned} bem aprendidos.</p>
        <div className="op-q-foot"><Link className="as-btn as-btn-primary" href="/aluno/treino-rapido">Treinar questões</Link><Link className="as-btn" href={`${basePath}/formulas`}>Ver todas as fórmulas</Link></div>
      </section>
    );
  }

  async function grade(value: FlashGrade) {
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const result = await post<{ state: FlashState }>({ action: "flash", formulaId: card.id, grade: value });
      patch((s) => ({ ...s, flash: { ...(s.flash ?? {}), [card.id]: result.state } }));
      setTally((t) => ({ ...t, [value]: t[value] + 1 }));
      setShown(false); setIndex((i) => i + 1);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Não foi possível salvar. Tente de novo.");
    } finally { setBusy(false); }
  }

  const preview = (value: FlashGrade) => {
    const next = nextFlash(states[card.id] ?? null, value, today);
    const days = FLASH_INTERVALS[next.box];
    return days === 0 ? "hoje" : days === 1 ? "amanhã" : `em ${days} dias`;
  };

  return (
    <div className="as-flash">
      <div className="as-meter">
        <div className="as-meter-head"><strong>Cartão {index + 1} de {queue.length}</strong><span className="as-muted">{info.due} para rever · {info.fresh} novos</span></div>
        <span className="op-bar" role="progressbar" aria-valuemin={0} aria-valuemax={queue.length} aria-valuenow={index} aria-label="Progresso do baralho"><i style={{ width: `${(index / queue.length) * 100}%` }} /></span>
      </div>
      <article className="as-flash-card" aria-live="polite">
        <p><span className="as-tag">{card.disciplineLabel}</span> <span className="as-tag">{card.topic}</span></p>
        <h2>{card.title}</h2>
        {shown ? (
          <div className="as-flash-back">
            {card.texHtml ? <div className="op-tex" dangerouslySetInnerHTML={{ __html: card.texHtml }} /> : null}
            <p>{card.meaning}</p>
            <dl className="op-dl"><dt>Quando usar</dt><dd>{card.conditions}</dd><dt>Exemplo</dt><dd>{card.example}</dd><dt>Erro comum</dt><dd>{card.commonError}</dd></dl>
            {card.moduleId ? <Link className="op-link" href={`${basePath}/materiais/${card.moduleId}`}>Ver no módulo: {card.moduleTitle || card.moduleId}</Link> : null}
          </div>
        ) : <p className="as-muted">Tente lembrar a fórmula e quando usá-la antes de virar o cartão.</p>}
      </article>
      {message ? <p className="op-error" role="alert">{message}</p> : null}
      {!shown ? (
        <button type="button" className="as-btn as-btn-primary" onClick={() => setShown(true)}>Mostrar resposta</button>
      ) : (
        <div className="as-flash-actions" role="group" aria-label="Como foi?">
          <button type="button" className="as-btn" disabled={busy} onClick={() => void grade("again")}>Errei<br /><small className="as-muted">volta {preview("again")}</small></button>
          <button type="button" className="as-btn as-btn-primary" disabled={busy} onClick={() => void grade("good")}>Acertei<br /><small>volta {preview("good")}</small></button>
          <button type="button" className="as-btn" disabled={busy} onClick={() => void grade("easy")}>Fácil<br /><small className="as-muted">volta {preview("easy")}</small></button>
        </div>
      )}
    </div>
  );
}
