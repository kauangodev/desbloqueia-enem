"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, post, useOperacaoState } from "./client";
import { disciplineLabel, type Correction, type Discipline, type PublicQuestion } from "../../lib/operacao/types";

export type Offer = { kind: string; title: string; description: string; available: number; planned: number; modes: { id: string; label: string }[] };
type Props = { offers: Offer[]; basePath: string };

type SessionData = { id: string; kind: string; mode: string; startedAt: string; limitMs: number | null; answers: Record<string, string>; flags: Record<string, boolean>; finished: boolean; expired: boolean };
type Loaded = { session: SessionData; questions: PublicQuestion[]; remainingMs: number | null; resumed?: boolean; shortfall?: { math: number; nature: number; per: number } };
type Result = { total: number; answered: number; blank: number; correct: number; percent: number; byDiscipline: Record<string, { total: number; correct: number; blank: number }>; byTopic: Record<string, { total: number; correct: number }>; weakTopics: string[]; elapsedMs: number };
type Finished = { result: Result; expired: boolean; corrections: Correction[] };

const fmtClock = (ms: number) => { const s = Math.max(Math.ceil(ms / 1000), 0); const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return `${h ? `${h}:` : ""}${String(m).padStart(h ? 2 : 1, "0")}:${String(s % 60).padStart(2, "0")}`; };
const kindTitle: Record<string, string> = { diagnostico: "Diagnóstico", "treino-1": "Treino 1", "treino-2": "Treino 2", "treino-3": "Treino 3", simulado: "Simulado" };

export default function SessionCenter({ offers, basePath }: Props) {
  const { state, error, reload } = useOperacaoState();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [finished, setFinished] = useState<Finished | null>(null);
  const [starting, setStarting] = useState("");
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

  return (
    <div className="op-stack">
      {error && !state ? <p className="op-error" role="alert">{error}</p> : null}
      {startError ? <p className="op-error" role="alert">{startError}</p> : null}
      <div className="op-grid op-grid-2">
        {offers.map((offer) => {
          const activeId = state?.active[offer.kind];
          const short = offer.planned < (offer.kind === "simulado" ? 90 : offer.kind === "diagnostico" ? 16 : 20);
          return (
            <section key={offer.kind} className="op-card op-offer" aria-labelledby={`o-${offer.kind}`}>
              <h3 id={`o-${offer.kind}`}>{offer.title}</h3>
              <p>{offer.description}</p>
              <p className="op-muted"><strong>{offer.planned} questões</strong> nesta versão{short ? " — o acervo publicado ainda não completa o formato oficial da atividade" : ""}.</p>
              <label className="op-field"><span>Modo</span>
                <select value={modeByKind[offer.kind] || offer.modes[0].id} onChange={(e) => setModeByKind((m) => ({ ...m, [offer.kind]: e.target.value }))}>
                  {offer.modes.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </label>
              <div className="op-q-foot">
                {activeId ? (<>
                  <button type="button" className="op-btn op-btn-primary" disabled={Boolean(starting)} onClick={() => start(offer.kind)}>Retomar de onde parei</button>
                  <button type="button" className="op-btn op-btn-ghost" disabled={Boolean(starting)} onClick={() => { if (window.confirm("Recomeçar descarta as respostas desta tentativa em andamento. Continuar?")) void start(offer.kind, true); }}>Recomeçar</button>
                </>) : <button type="button" className="op-btn op-btn-primary" disabled={Boolean(starting) || !offer.planned} onClick={() => start(offer.kind)} data-analytics-event={`operacao_start_${offer.kind}`}>{starting === offer.kind ? "Preparando…" : "Começar"}</button>}
              </div>
            </section>
          );
        })}
      </div>
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

function Player({ data, basePath, onFinished, onExit }: { data: Loaded; basePath: string; onFinished: (f: Finished) => void; onExit: () => void }) {
  const { session, questions } = data;
  const [answers, setAnswers] = useState<Record<string, string>>(session.answers || {});
  const [flags, setFlags] = useState<Record<string, boolean>>(session.flags || {});
  const [index, setIndex] = useState(0);
  const [saveState, setSaveState] = useState<"ok" | "saving" | "fail">("ok");
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [deadline] = useState<number | null>(() => (data.remainingMs === null ? null : Date.now() + data.remainingMs));
  const warned = useRef<Set<number>>(new Set());
  const [warning, setWarning] = useState("");
  const finishing_ = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  const latest = useRef({ answers, flags });
  useEffect(() => { latest.current = { answers, flags }; }, [answers, flags]);

  const save = useCallback(async () => {
    setSaveState("saving");
    try {
      const res = await post<{ saved?: boolean; expired?: boolean; finished?: boolean }>({ action: "sessionSave", sessionId: session.id, answers: latest.current.answers, flags: latest.current.flags });
      dirty.current = false;
      setSaveState("ok");
      return res;
    } catch { setSaveState("fail"); return null; }
  }, [session.id]);

  const schedule = useCallback(() => { dirty.current = true; if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => { void save(); }, 700); }, [save]);

  // tenta novamente automaticamente enquanto houver falha de salvamento
  useEffect(() => { if (saveState !== "fail") return; const id = setTimeout(() => { void save(); }, 4000); return () => clearTimeout(id); }, [saveState, save]);

  const finish = useCallback(async (auto = false) => {
    if (finishing_.current) return; // evita envio duplo
    finishing_.current = true; setFinishing(true); setFinishError("");
    try {
      if (timer.current) clearTimeout(timer.current);
      if (!auto) await save();
      const res = await post<Finished>({ action: "sessionFinish", sessionId: session.id });
      onFinished(res);
    } catch (e) {
      finishing_.current = false; setFinishing(false);
      setFinishError(e instanceof ApiError ? e.message : "Não foi possível finalizar. Suas respostas continuam salvas; tente de novo.");
    }
  }, [onFinished, save, session.id]);

  useEffect(() => {
    if (deadline === null) return;
    const id = setInterval(() => {
      const t = Date.now(); setNow(t);
      const left = deadline! - t;
      for (const mark of [600000, 300000, 60000]) if (left <= mark && left > 0 && !warned.current.has(mark)) { warned.current.add(mark); setWarning(`Faltam ${mark / 60000} minuto${mark === 60000 ? "" : "s"}.`); }
      if (left <= 0) { clearInterval(id); void finish(true); }
    }, 1000);
    return () => clearInterval(id);
  }, [finish]);

  useEffect(() => {
    const onHide = () => { if (dirty.current) void save(); };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [save]);

  const q = questions[index];
  const answeredCount = questions.filter((x) => answers[x.id]).length;
  const blank = questions.length - answeredCount;
  const remaining = deadline === null ? null : Math.max(deadline - now, 0);

  const mathCount = useMemo(() => questions.filter((x) => x.discipline === "matematica").length, [questions]);
  const choose = (id: string) => { setAnswers((a) => ({ ...a, [q.id]: id })); schedule(); };
  const clear = () => { setAnswers((a) => { const next = { ...a }; delete next[q.id]; return next; }); schedule(); };
  const flag = () => { setFlags((f) => ({ ...f, [q.id]: !f[q.id] })); schedule(); };

  if (!q) return <div className="op-card">Esta atividade não tem questões publicadas. <button className="op-btn" onClick={onExit}>Voltar</button></div>;

  return (
    <div className="op-player">
      <header className="op-card op-player-bar">
        <div>
          <strong>{kindTitle[session.kind] || session.kind}</strong>
          <span className="op-muted"> · {answeredCount}/{questions.length} respondidas</span>
          {data.resumed ? <span className="op-tag op-tag-soft">retomada</span> : null}
        </div>
        <div className="op-player-meta">
          {remaining !== null ? <span className={`op-timer ${remaining < 300000 ? "is-low" : ""}`} role="timer" aria-label={`Tempo restante ${fmtClock(remaining)}`}>{fmtClock(remaining)}</span> : <span className="op-muted">Sem limite de tempo</span>}
          <span className={`op-save op-save-${saveState}`} role="status" aria-live="polite">{saveState === "saving" ? "Salvando…" : saveState === "fail" ? "Falha ao salvar — tentando de novo" : "Salvo"}</span>
        </div>
      </header>
      {data.shortfall && (data.shortfall.math > 0 || data.shortfall.nature > 0) ? <p className="op-note" role="note">Aviso: esta versão tem {mathCount} questões de Matemática e {questions.length - mathCount} de Natureza, menos que o formato de {data.shortfall.per}+{data.shortfall.per}, porque o acervo publicado ainda é menor. O resultado vale apenas para estas questões.</p> : null}
      <div className="op-sr" aria-live="assertive">{warning}</div>
      {warning ? <p className="op-warning" role="status">{warning}</p> : null}
      {saveState === "fail" ? <p className="op-error" role="alert">Não conseguimos salvar suas respostas agora. Elas ficam nesta tela e uma nova tentativa é feita automaticamente. <button type="button" className="op-btn" onClick={() => void save()}>Tentar agora</button></p> : null}
      <div className="op-player-layout">
        <div>
          <article className="op-card op-question" aria-label={`Questão ${index + 1} de ${questions.length}`}>
            <header className="op-q-head"><div className="op-q-tags"><span className="op-tag">{disciplineLabel[q.discipline as Discipline]}</span><span className="op-tag op-tag-soft">{q.topic}</span><span className={`op-tag op-tag-origin op-origin-${q.origin}`}>{q.originLabel}</span></div></header>
            <h3 className="op-q-title">Questão {index + 1} de {questions.length}{q.officialRef ? <small> · {q.officialRef}</small> : null}</h3>
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
          <div className="op-pager">
            <button type="button" className="op-btn" disabled={index === 0} onClick={() => setIndex(index - 1)}>Anterior</button>
            <button type="button" className="op-btn op-btn-primary" disabled={index >= questions.length - 1} onClick={() => setIndex(index + 1)}>Próxima</button>
          </div>
        </div>
        <aside className="op-card op-map" aria-label="Mapa de questões">
          <h4>Mapa</h4>
          <ol className="op-map-grid">
            {questions.map((x, i) => (
              <li key={x.id}><button type="button" className={`op-dot ${i === index ? "is-current" : ""} ${answers[x.id] ? "is-done" : ""} ${flags[x.id] ? "is-flag" : ""}`} aria-label={`Questão ${i + 1}${answers[x.id] ? ", respondida" : ", em branco"}${flags[x.id] ? ", com dúvida" : ""}`} aria-current={i === index ? "true" : undefined} onClick={() => setIndex(i)}>{i + 1}</button></li>
            ))}
          </ol>
          <p className="op-muted op-legend">Preenchido: respondida · borda destacada: dúvida.</p>
          <button type="button" className="op-btn op-btn-primary op-block" disabled={finishing} onClick={() => setConfirmFinish(true)}>Finalizar</button>
          <button type="button" className="op-btn op-btn-ghost op-block" onClick={async () => { if (dirty.current) await save(); onExit(); }}>Sair e continuar depois</button>
        </aside>
      </div>
      {confirmFinish ? (
        <div className="op-modal" role="dialog" aria-modal="true" aria-labelledby="fin-t">
          <div className="op-card">
            <h3 id="fin-t">Finalizar agora?</h3>
            <p>{blank ? `Você deixou ${blank} questão(ões) em branco. Elas contam como não respondidas.` : "Todas as questões foram respondidas."} Depois de finalizar, não dá para alterar as respostas.</p>
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
