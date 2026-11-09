"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, post, useOperacaoState } from "./client";
import QuestionMap, { type MapItem } from "../question-map";
import { sessionKinds } from "../../lib/operacao/kinds";
import { disciplineLabel, type Correction, type Discipline, type PublicQuestion } from "../../lib/operacao/types";

export type Offer = { kind: string; group: "diagnostico" | "treino" | "simulado"; title: string; description: string; planned: number; modes: { id: string; label: string }[]; durationLabel: string; questionsLabel: string };
type Props = { offers: Offer[]; basePath: string };

type SessionData = { id: string; kind: string; mode: string; startedAt: string; limitMs: number | null; answers: Record<string, string>; flags: Record<string, boolean>; finished: boolean; expired: boolean };
type Loaded = { session: SessionData; questions: PublicQuestion[]; remainingMs: number | null; resumed?: boolean; seenCount?: number; shortfall?: { math: number; nature: number; per: number } };
type Result = { total: number; answered: number; blank: number; correct: number; percent: number; byDiscipline: Record<string, { total: number; correct: number; blank: number }>; byTopic: Record<string, { total: number; correct: number }>; weakTopics: string[]; elapsedMs: number };
type Finished = { result: Result; expired: boolean; corrections: Correction[] };

const fmtClock = (ms: number) => { const s = Math.max(Math.ceil(ms / 1000), 0); const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return `${h ? `${h}:` : ""}${String(m).padStart(h ? 2 : 1, "0")}:${String(s % 60).padStart(2, "0")}`; };
const kindTitle: Record<string, string> = Object.fromEntries(Object.entries(sessionKinds).map(([id, def]) => [id, def.title.split(" — ")[0]]));
const groups: { id: Offer["group"]; title: string; text: string }[] = [
  { id: "simulado", title: "Simulados completos", text: "90 questões (45 de Matemática e 45 de Natureza), com mapa de questões, cronômetro de referência e correção ao final." },
  { id: "treino", title: "Treinos curtos", text: "20 questões (10 de Matemática e 10 de Natureza) para praticar sem pressa ou com tempo." },
  { id: "diagnostico", title: "Diagnóstico", text: "Opcional e curto, para orientar por onde começar." },
];

export default function SessionCenter({ offers, basePath }: Props) {
  const { state, error, reload } = useOperacaoState();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [finished, setFinished] = useState<Finished | null>(null);
  const [starting, setStarting] = useState("");
  const [confirmRestart, setConfirmRestart] = useState<string | null>(null);
  const [startError, setStartError] = useState("");
  const [modeByKind, setModeByKind] = useState<Record<string, string>>({});

  async function start(kind: string, restart = false) {
    if (starting) return;
    setStarting(kind); setStartError("");
    try {
      const mode = modeByKind[kind] || offers.find((o) => o.kind === kind)?.modes[0].id || "livre";
      const data = await post<Loaded>({ action: "sessionStart", kind, mode, restart });
      setFinished(null); setLoaded(data);
    } catch (e) { setStartError(e instanceof ApiError ? e.message : "Não foi possível iniciar."); }
    finally { setStarting(""); }
  }

  if (loaded && !finished) return <Player data={loaded} basePath={basePath} onFinished={(f) => { setFinished(f); void reload(); }} onExit={() => { setLoaded(null); void reload(); }} />;
  if (loaded && finished) return <Results finished={finished} loaded={loaded} basePath={basePath} onBack={() => { setLoaded(null); setFinished(null); void reload(); }} />;

  const statusOf = (kind: string) => {
    if (state?.active[kind]) return "Em andamento";
    const last = state?.lastByKind?.[kind];
    return last ? `Último resultado: ${last.percent}% (${last.correct}/${last.total}) em ${new Date(last.finishedAt).toLocaleDateString("pt-BR")}` : "Não iniciado";
  };

  return (
    <div className="op-stack">
      {error && !state ? <p className="op-error" role="alert">{error}</p> : null}
      {startError ? <p className="op-error" role="alert">{startError}</p> : null}
      {groups.map((group) => {
        const list = offers.filter((o) => o.group === group.id);
        if (!list.length) return null;
        return (
          <section key={group.id} className="op-stack" aria-labelledby={`g-${group.id}`}>
            <div><h3 id={`g-${group.id}`} className="op-section-title">{group.title}</h3><p className="op-muted">{group.text}</p></div>
            <div className={`op-grid ${group.id === "treino" ? "op-grid-3" : "op-grid-2"}`}>
              {list.map((offer) => {
                const activeId = state?.active[offer.kind];
                return (
                  <article key={offer.kind} className="op-card op-offer" aria-labelledby={`o-${offer.kind}`}>
                    <h4 id={`o-${offer.kind}`}>{offer.title}</h4>
                    <p className="op-offer-obj">{offer.description}</p>
                    <ul className="op-offer-meta">
                      <li><strong>{offer.questionsLabel}</strong></li>
                      <li>{offer.durationLabel}</li>
                      <li className={activeId ? "is-active" : ""}>{statusOf(offer.kind)}</li>
                    </ul>
                    <label className="op-field"><span>Modo</span>
                      <select value={modeByKind[offer.kind] || offer.modes[0].id} onChange={(e) => setModeByKind((m) => ({ ...m, [offer.kind]: e.target.value }))}>
                        {offer.modes.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                      </select>
                    </label>
                    <div className="op-q-foot">
                      {activeId ? (<>
                        <button type="button" className="op-btn op-btn-primary" disabled={Boolean(starting)} onClick={() => start(offer.kind)}>Retomar de onde parei</button>
                        {confirmRestart === offer.kind ? null : <button type="button" className="op-btn op-btn-ghost" disabled={Boolean(starting)} aria-haspopup="dialog" onClick={() => setConfirmRestart(offer.kind)}>Recomeçar…</button>}
                      </>) : <button type="button" className="op-btn op-btn-primary" disabled={Boolean(starting) || !offer.planned} onClick={() => start(offer.kind)} data-analytics-event={`operacao_start_${offer.kind}`}>{starting === offer.kind ? "Preparando…" : "Começar"}</button>}
                    </div>
                    {confirmRestart === offer.kind ? (
                      <div className="op-confirm" role="alertdialog" aria-labelledby={`rc-${offer.kind}`} aria-describedby={`rd-${offer.kind}`} onKeyDown={(e) => { if (e.key === "Escape") setConfirmRestart(null); }}>
                        <strong id={`rc-${offer.kind}`}>Recomeçar esta atividade?</strong>
                        <p id={`rd-${offer.kind}`}>As respostas e marcações da tentativa em andamento deixarão de poder ser retomadas e uma nova tentativa começará do zero. Resultados já concluídos no histórico não são afetados.</p>
                        <div className="op-q-foot">
                          <button type="button" className="op-btn op-btn-ghost" autoFocus onClick={() => setConfirmRestart(null)}>Cancelar, manter tentativa</button>
                          <button type="button" className="op-btn op-btn-danger" disabled={Boolean(starting)} onClick={() => { setConfirmRestart(null); void start(offer.kind, true); }}>Sim, descartar e recomeçar</button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
      <section className="op-card" aria-labelledby="hist">
        <h3 id="hist">Histórico recente</h3>
        {state?.finished.length ? (
          <ul className="op-list">
            {state.finished.map((f) => (
              <li key={f.id}><strong>{kindTitle[f.kind] || f.kind}</strong> · {new Date(f.finishedAt).toLocaleString("pt-BR")} · {f.result.correct}/{f.result.total} acertos ({f.result.percent}%){f.result.blank ? ` · ${f.result.blank} em branco` : ""}{f.expired ? " · tempo esgotado" : ""}</li>
            ))}
          </ul>
        ) : <p className="op-muted">Você ainda não concluiu nenhuma atividade. Quando concluir, o resultado aparece aqui.</p>}
        <p className="op-muted">Os resultados mostram percentual de acertos por área e tópico. Não são “nota do Enem” nem estimativa de TRI.</p>
      </section>
    </div>
  );
}

/** Relógio isolado: só ele se atualiza a cada segundo, sem renderizar de novo a questão nem o mapa. */
function Countdown({ deadline, onMark, onExpire }: { deadline: number; onMark: (minutes: number) => void; onExpire: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const marks = useRef<Set<number>>(new Set());
  const expired = useRef(false);
  const cb = useRef({ onMark, onExpire });
  useEffect(() => { cb.current = { onMark, onExpire }; });
  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now(); setNow(t);
      const left = deadline - t;
      for (const mark of [600000, 300000, 60000]) if (left <= mark && left > 0 && !marks.current.has(mark)) { marks.current.add(mark); cb.current.onMark(mark / 60000); }
      if (left <= 0 && !expired.current) { expired.current = true; clearInterval(id); cb.current.onExpire(); }
    }, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  const remaining = Math.max(deadline - now, 0);
  return <span className={`op-timer ${remaining < 300000 ? "is-low" : ""}`} role="timer" aria-label={`Tempo restante ${fmtClock(remaining)}`}>{fmtClock(remaining)}</span>;
}

type SaveState = "ok" | "dirty" | "saving" | "fail";
const areaOf = (d: string) => (d === "matematica" ? "Matemática" : "Natureza");

function Player({ data, basePath, onFinished, onExit }: { data: Loaded; basePath: string; onFinished: (f: Finished) => void; onExit: () => void }) {
  const { session, questions } = data;
  const [answers, setAnswers] = useState<Record<string, string>>(session.answers || {});
  const [flags, setFlags] = useState<Record<string, boolean>>(session.flags || {});
  const [index, setIndex] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("ok");
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState("");
  const [deadline] = useState<number | null>(() => (data.remainingMs === null ? null : Date.now() + data.remainingMs));
  const [warning, setWarning] = useState("");
  const finishingRef = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  const latest = useRef({ answers, flags });
  useEffect(() => { latest.current = { answers, flags }; }, [answers, flags]);

  const save = useCallback(async () => {
    setSaveState("saving");
    try {
      await post<{ saved?: boolean; expired?: boolean; finished?: boolean }>({ action: "sessionSave", sessionId: session.id, answers: latest.current.answers, flags: latest.current.flags });
      dirty.current = false;
      setSaveState("ok");
      return true;
    } catch { setSaveState("fail"); return false; }
  }, [session.id]);

  const schedule = useCallback(() => { dirty.current = true; setSaveState((s) => (s === "saving" ? s : "dirty")); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => { void save(); }, 700); }, [save]);

  // Falha de salvamento: nova tentativa automática, e também quando a conexão volta.
  useEffect(() => { if (saveState !== "fail") return; const id = setTimeout(() => { void save(); }, 4000); return () => clearTimeout(id); }, [saveState, save]);
  useEffect(() => {
    const online = () => { if (dirty.current) void save(); };
    const beforeUnload = (e: BeforeUnloadEvent) => { if (dirty.current) { e.preventDefault(); e.returnValue = ""; } };
    const hide = () => { if (document.visibilityState === "hidden" && dirty.current) void save(); };
    window.addEventListener("online", online); window.addEventListener("beforeunload", beforeUnload); document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("online", online); window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("visibilitychange", hide); };
  }, [save]);

  const finish = useCallback(async (auto = false) => {
    if (finishingRef.current) return; // encerramento idempotente: evita envio duplo
    finishingRef.current = true; setFinishing(true); setFinishError("");
    try {
      if (timer.current) clearTimeout(timer.current);
      if (!auto) await save();
      const res = await post<Finished>({ action: "sessionFinish", sessionId: session.id });
      dirty.current = false;
      onFinished(res);
    } catch (e) {
      finishingRef.current = false; setFinishing(false);
      setFinishError(e instanceof ApiError ? e.message : "Não foi possível finalizar. Suas respostas continuam salvas; tente de novo.");
    }
  }, [onFinished, save, session.id]);

  const items = useMemo<MapItem[]>(() => questions.map((x) => ({ id: x.id, area: areaOf(x.discipline), answered: Boolean(answers[x.id]), flagged: Boolean(flags[x.id]) })), [questions, answers, flags]);
  const select = useCallback((i: number) => setIndex(i), []);

  const q = questions[index];
  const answeredCount = items.filter((it) => it.answered).length;
  const blank = questions.length - answeredCount;
  const mathCount = useMemo(() => questions.filter((x) => x.discipline === "matematica").length, [questions]);
  const choose = (id: string) => { setAnswers((a) => ({ ...a, [q.id]: id })); schedule(); };
  const clear = () => { setAnswers((a) => { const next = { ...a }; delete next[q.id]; return next; }); schedule(); };
  const flag = () => { setFlags((f) => ({ ...f, [q.id]: !f[q.id] })); schedule(); };

  if (!q) return <div className="op-card">Esta atividade não tem questões publicadas. <button className="op-btn" onClick={onExit}>Voltar</button></div>;

  const saveLabel = saveState === "saving" ? "Salvando…" : saveState === "dirty" ? "Alterações ainda não sincronizadas" : saveState === "fail" ? "Falha ao salvar — tentando de novo" : "Tudo salvo";
  const actions = (
    <>
      <button type="button" className="op-btn op-btn-primary op-block" disabled={finishing} onClick={() => setConfirmFinish(true)}>Finalizar</button>
      <button type="button" className="op-btn op-btn-ghost op-block" onClick={async () => { if (dirty.current) await save(); onExit(); }}>Sair e continuar depois</button>
    </>
  );

  return (
    <div className="op-player">
      <header className="op-card op-player-bar">
        <div>
          <strong>{kindTitle[session.kind] || session.kind}</strong>
          <span className="op-muted"> · {answeredCount}/{questions.length} respondidas</span>
          {data.resumed ? <span className="op-tag op-tag-soft">retomada</span> : null}
        </div>
        <div className="op-player-meta">
          {deadline !== null ? <Countdown deadline={deadline} onMark={(m) => setWarning(`Faltam ${m} minuto${m === 1 ? "" : "s"}.`)} onExpire={() => void finish(true)} /> : <span className="op-muted">Sem limite de tempo</span>}
          <span className={`op-save op-save-${saveState}`} role="status" aria-live="polite">{saveLabel}</span>
        </div>
      </header>
      {data.shortfall && (data.shortfall.math > 0 || data.shortfall.nature > 0) ? <p className="op-note" role="note">Aviso: esta versão tem {mathCount} questões de Matemática e {questions.length - mathCount} de Natureza, menos que o formato de {data.shortfall.per}+{data.shortfall.per}, porque o acervo publicado ainda é menor. O resultado vale apenas para estas questões.</p> : null}
      {data.seenCount ? <p className="op-note" role="note">{data.seenCount} {data.seenCount === 1 ? "questão desta atividade você já praticou" : "questões desta atividade você já praticou"} antes, porque ainda não há itens inéditos suficientes.</p> : null}
      {warning ? <p className="op-warning" role="status">{warning}</p> : null}
      {saveState === "fail" ? <p className="op-error" role="alert">Não conseguimos salvar suas respostas agora. Elas ficam nesta tela e uma nova tentativa é feita automaticamente. <button type="button" className="op-btn" onClick={() => void save()}>Tentar agora</button></p> : null}
      <div className="op-player-layout">
        <div className="op-player-main">
          <article className="op-card op-question" aria-labelledby="op-q-title">
            <header className="op-q-head"><div className="op-q-tags"><span className="op-tag">{disciplineLabel[q.discipline as Discipline]}</span><span className="op-tag op-tag-soft">{q.topic}</span><span className={`op-tag op-tag-origin op-origin-${q.origin}`}>{q.originLabel}</span></div></header>
            <h3 id="op-q-title" tabIndex={-1} className="op-q-title">Questão {index + 1} de {questions.length}{q.officialRef ? <small> · {q.officialRef}</small> : null}</h3>
            <div className="op-rich" dangerouslySetInnerHTML={{ __html: q.statementHtml }} />
            {q.figure ? <figure className="op-figure"><img src={q.figure.src} alt={q.figure.alt} /></figure> : null}
            <div role="radiogroup" aria-label="Alternativas" className="op-options">
              {q.options.map((o) => (
                <label key={o.id} className={`op-option ${answers[q.id] === o.id ? "is-selected" : ""}`}>
                  <input type="radio" name={`q-${q.id}`} value={o.id} checked={answers[q.id] === o.id} onChange={() => choose(o.id)} />
                  <span className="op-letter" aria-hidden="true">{o.id}</span>
                  <span className="op-option-text"><span className="op-sr">Alternativa {o.id}: </span><span dangerouslySetInnerHTML={{ __html: o.html }} /></span>
                </label>
              ))}
            </div>
            <div className="op-q-foot">
              <button type="button" className="op-btn op-btn-ghost" onClick={clear} disabled={!answers[q.id]}>Limpar resposta</button>
              <button type="button" className="op-btn op-btn-ghost" aria-pressed={Boolean(flags[q.id])} onClick={flag}>{flags[q.id] ? "Dúvida marcada ✓" : "Marcar dúvida"}</button>
            </div>
          </article>
          <div className="op-pager op-pager-player">
            <button type="button" className="op-btn" disabled={index === 0} onClick={() => setIndex(index - 1)}>Anterior</button>
            <QuestionMap part="sheet" items={items} current={index} onSelect={select} focusTargetId="op-q-title" showFlags>{actions}</QuestionMap>
            <button type="button" className="op-btn op-btn-primary" disabled={index >= questions.length - 1} onClick={() => setIndex(index + 1)}>Próxima</button>
          </div>
        </div>
        <QuestionMap part="aside" items={items} current={index} onSelect={select} focusTargetId="op-q-title" showFlags>{actions}</QuestionMap>
      </div>
      {confirmFinish ? (
        <div className="op-modal" role="dialog" aria-modal="true" aria-labelledby="fin-t">
          <div className="op-card">
            <h3 id="fin-t">Finalizar agora?</h3>
            <p>{blank ? `Você deixou ${blank} ${blank === 1 ? "questão em branco. Ela conta como não respondida." : "questões em branco. Elas contam como não respondidas."}` : "Todas as questões foram respondidas."} Depois de finalizar, não dá para alterar as respostas.</p>
            {saveState !== "ok" ? <p className="op-note">Suas últimas alterações serão enviadas antes de finalizar.</p> : null}
            {finishError ? <p className="op-error" role="alert">{finishError}</p> : null}
            <div className="op-q-foot">
              <button type="button" className="op-btn op-btn-primary" disabled={finishing} onClick={() => void finish(false)}>{finishing ? "Finalizando…" : "Sim, finalizar"}</button>
              <button type="button" className="op-btn" disabled={finishing} onClick={() => setConfirmFinish(false)}>Voltar à atividade</button>
            </div>
          </div>
        </div>
      ) : null}
      {finishing && !confirmFinish ? <p className="op-note" role="status">Tempo esgotado. Finalizando e corrigindo…</p> : null}
      <p className="op-muted"><Link href={`${basePath}/treinos`}>Voltar aos treinos</Link> a qualquer momento: sua atividade fica salva.</p>
    </div>
  );
}

function Results({ finished, loaded, basePath, onBack }: { finished: Finished; loaded: Loaded; basePath: string; onBack: () => void }) {
  const { result } = finished;
  const byId = new Map(loaded.questions.map((q) => [q.id, q]));
  return (
    <div className="op-stack">
      <section className="op-card op-results" aria-labelledby="res-t">
        <h2 id="res-t">Resultado: {kindTitle[loaded.session.kind] || loaded.session.kind}</h2>
        {finished.expired ? <p className="op-note">O tempo terminou. As respostas salvas até aquele momento foram corrigidas.</p> : null}
        <p className="op-big">{result.correct} de {result.total} acertos <span>({result.percent}%)</span></p>
        <p className="op-muted">{result.answered} respondidas · {result.blank} em branco · tempo: {fmtClock(result.elapsedMs)}. Percentual de acertos neste conjunto; não é nota do Enem nem estimativa de TRI.</p>
        <h3>Por disciplina</h3>
        <ul className="op-list">
          {Object.entries(result.byDiscipline).map(([d, v]) => <li key={d}><strong>{disciplineLabel[d as Discipline]}</strong>: {v.correct}/{v.total}{v.blank ? ` (${v.blank} em branco)` : ""}</li>)}
        </ul>
        <h3>Por tópico</h3>
        <ul className="op-list">
          {Object.entries(result.byTopic).sort((a, b) => a[0].localeCompare(b[0])).map(([t, v]) => <li key={t}>{t}: {v.correct}/{v.total}</li>)}
        </ul>
        {result.weakTopics.length ? <p className="op-note">Priorize revisar: <strong>{result.weakTopics.join(", ")}</strong>. As questões erradas já estão no seu <Link href={`${basePath}/erros`}>caderno de erros</Link>.</p> : <p className="op-muted">Sem tópicos abaixo de 50% neste conjunto.</p>}
        <div className="op-q-foot"><button type="button" className="op-btn op-btn-primary" onClick={onBack}>Voltar aos treinos</button><Link className="op-btn" href={`${basePath}/erros`}>Abrir meus erros</Link></div>
      </section>
      <section className="op-card" aria-labelledby="corr-t">
        <h3 id="corr-t">Correção comentada</h3>
        <div className="op-stack">
          {finished.corrections.map((c, i) => {
            const q = byId.get(c.questionId);
            return (
              <details key={c.questionId} className={`op-correction ${c.selected === null ? "is-blank" : c.correct ? "is-ok" : "is-bad"}`}>
                <summary>Questão {i + 1} — {q?.topic} — {c.selected === null ? "em branco" : c.correct ? "acertou" : `errou (marcou ${c.selected})`}</summary>
                <div className="op-rich" dangerouslySetInnerHTML={{ __html: q?.statementHtml || "" }} />
                <p><strong>Resposta correta: {c.answer}.</strong></p>
                {c.distractorHtml ? <div className="op-rich"><strong>Sobre a sua alternativa: </strong><span dangerouslySetInnerHTML={{ __html: c.distractorHtml }} /></div> : null}
                <div className="op-rich" dangerouslySetInnerHTML={{ __html: c.resolutionHtml }} />
                <p className="op-misconception"><strong>Erro comum:</strong> {c.misconception}</p>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}
