"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import BookLibraryHero from "./BookLibraryHero";
import type { DemoModule, DemoQuestion, ExplorerData } from "./explorer-types";

/**
 * Exploração do produto na hero. Cada aba mostra um recurso real da área do aluno com AMOSTRAS selecionadas.
 * Estado 100% local e descartável: nada é salvo, nenhum progresso é gerado e nenhum conteúdo pago é carregado
 * além das amostras recebidas do servidor. A animação dos livros vive na aba "Reta final" e continua montada
 * (apenas oculta) ao trocar de aba, então a cena 3D se pausa sozinha fora da tela.
 */
type TabId = "reta" | "materiais" | "questoes" | "simulado" | "plano";
const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: "reta", label: "Reta final", icon: "M5 21V4m0 0h11l-2 4 2 4H5" },
  { id: "materiais", label: "Materiais", icon: "M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16ZM8 7h8M8 11h6" },
  { id: "questoes", label: "Questões", icon: "M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" },
  { id: "simulado", label: "Simulado", icon: "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM9 1h6" },
  { id: "plano", label: "Revisão", icon: "M9 11l2 2 4-4M5 4h14v16H5V4Z" },
];

function Html({ html, className }: { html: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function HeroExplorer({ data }: { data: ExplorerData }) {
  const [tab, setTab] = useState<TabId>("reta");
  const [disc, setDisc] = useState<DemoModule["disc"]>("matematica");
  const uid = useId();

  // "Experimentar uma questão" (CTA secundária) abre a aba de questões sem navegar para outra página.
  useEffect(() => {
    const sync = () => {
      if (window.location.hash === "#experimentar") setTab("questoes");
    };
    sync();
    const openTab = (event: Event) => { const id = (event as CustomEvent<string>).detail as TabId; if (tabs.some((item) => item.id === id)) setTab(id); };
    window.addEventListener("hashchange", sync);
    window.addEventListener("godev:open-tab", openTab);
    return () => { window.removeEventListener("hashchange", sync); window.removeEventListener("godev:open-tab", openTab); };
  }, []);

  function onKey(event: React.KeyboardEvent, index: number) {
    const last = tabs.length - 1;
    let next = -1;
    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next < 0) return;
    event.preventDefault();
    setTab(tabs[next].id);
    document.getElementById(`${uid}-tab-${tabs[next].id}`)?.focus();
  }

  const activeIndex = Math.max(0, tabs.findIndex((item) => item.id === tab));
  // Deslizar o dedo para os lados troca de aba (só no toque; vertical continua rolando a página).
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (event: React.TouchEvent) => { const t = event.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touch.current; touch.current = null;
    if (!start) return;
    const t = event.changedTouches[0];
    const dx = t.clientX - start.x; const dy = t.clientY - start.y;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    const next = Math.min(tabs.length - 1, Math.max(0, activeIndex + (dx < 0 ? 1 : -1)));
    if (next !== activeIndex) setTab(tabs[next].id);
  };

  const ctaHref = data.hasAccess ? data.studyArea : "#planos";
  const ctaLabel = data.hasAccess ? "Continuar minha revisão" : "Acessar a preparação completa";

  return (
    <section className="hx" id="experimentar" aria-label="Explore a plataforma">
      <div className="hx-tabs" role="tablist" aria-label="Recursos da plataforma" style={{ ["--idx" as string]: activeIndex } as React.CSSProperties}>
        <i className="hx-ink" aria-hidden="true" />
        {tabs.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${uid}-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`${uid}-panel-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            className="hx-tab"
            data-analytics-event="explorer_tab"
            onClick={() => setTab(item.id)}
            onKeyDown={(event) => onKey(event, index)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={item.icon} /></svg>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="hx-panels" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div role="tabpanel" id={`${uid}-panel-reta`} aria-labelledby={`${uid}-tab-reta`} hidden={tab !== "reta"} className="hx-panel hx-panel-reta">
          <BookLibraryHero />
          <ul className="hx-chips" aria-label="Disciplinas da reta final">
            {data.modules.map((m) => (
              <li key={m.disc}>
                <button type="button" className="hx-chip" onClick={() => { setDisc(m.disc); setTab("materiais"); }}>{m.discLabel}</button>
              </li>
            ))}
          </ul>
        </div>

        <div role="tabpanel" id={`${uid}-panel-materiais`} aria-labelledby={`${uid}-tab-materiais`} hidden={tab !== "materiais"} className="hx-panel">
          <MaterialsDemo modules={data.modules} disc={disc} onDisc={setDisc} />
        </div>

        <div role="tabpanel" id={`${uid}-panel-questoes`} aria-labelledby={`${uid}-tab-questoes`} hidden={tab !== "questoes"} className="hx-panel">
          <PracticeDemo questions={data.questions} />
        </div>

        <div role="tabpanel" id={`${uid}-panel-simulado`} aria-labelledby={`${uid}-tab-simulado`} hidden={tab !== "simulado"} className="hx-panel">
          <SimuladoDemo questions={data.questions} counts={data.counts} />
        </div>

        <div role="tabpanel" id={`${uid}-panel-plano`} aria-labelledby={`${uid}-tab-plano`} hidden={tab !== "plano"} className="hx-panel">
          <PlanDemo />
        </div>
      </div>

      <div className="hx-foot">
        <p>Demonstração com amostras. Nada aqui é salvo. Deslize para o lado para ver o próximo recurso.</p>
        <Link className="ref-button ref-button-primary ref-button-hot" href={ctaHref} data-analytics-event="explorer_cta">{ctaLabel}</Link>
      </div>
    </section>
  );
}

/* ───────── Materiais ───────── */
function MaterialsDemo({ modules, disc, onDisc }: { modules: DemoModule[]; disc: DemoModule["disc"]; onDisc: (d: DemoModule["disc"]) => void }) {
  const current = modules.find((m) => m.disc === disc) ?? modules[0];
  if (!current) return null;
  return (
    <div className="hx-card">
      <div className="hx-disc" role="group" aria-label="Escolha uma disciplina">
        {modules.map((m) => (
          <button key={m.disc} type="button" className="hx-disc-btn" aria-pressed={m.disc === current.disc} onClick={() => onDisc(m.disc)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.cover} alt="" width={320} height={480} loading="lazy" decoding="async" />
            <span>{m.discLabel}</span>
          </button>
        ))}
      </div>
      <article className="hx-reader" role="region" tabIndex={0} aria-label={`Amostra de leitura: ${current.title}`}>
        <p className="hx-eyebrow">Amostra de leitura · {current.discLabel} · {current.minutes} min</p>
        <h3>{current.title}</h3>
        <p className="hx-muted">{current.objective}</p>
        <Html className="hx-rich" html={current.conceptHtml} />
        {current.example ? (
          <div className="hx-example">
            <strong>Exemplo resolvido: {current.example.title}</strong>
            <Html className="hx-rich" html={current.example.problemHtml} />
            <Html className="hx-rich hx-solution" html={current.example.solutionHtml} />
          </div>
        ) : null}
      </article>
    </div>
  );
}

/* ───────── Questões ───────── */
function Option({ id, html, state, name, checked, disabled, onChange }: { id: string; html: string; state: string; name: string; checked: boolean; disabled?: boolean; onChange: () => void }) {
  return (
    <label className={`hx-option ${state}`}>
      <input type="radio" name={name} value={id} checked={checked} disabled={disabled} onChange={onChange} />
      <span className="hx-letter" aria-hidden="true">{id}</span>
      <span className="hx-option-text">
        <span className="sr-only">Alternativa {id}: </span>
        <span dangerouslySetInnerHTML={{ __html: html }} />
      </span>
    </label>
  );
}

function PracticeDemo({ questions }: { questions: DemoQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [hits, setHits] = useState(0);
  const [done, setDone] = useState(false);
  const group = useId();
  const feedback = useRef<HTMLDivElement>(null);
  const q = questions[index];

  useEffect(() => {
    if (confirmed) feedback.current?.focus({ preventScroll: false });
  }, [confirmed]);
  if (!q) return null;

  const restart = () => { setIndex(0); setPicked(""); setConfirmed(false); setHits(0); setDone(false); };
  const confirm = () => {
    if (!picked) return;
    setConfirmed(true);
    if (picked === q.answer) setHits((n) => n + 1);
  };
  const next = () => {
    if (index >= questions.length - 1) { setDone(true); return; }
    setIndex(index + 1);
    setPicked("");
    setConfirmed(false);
  };

  if (done) {
    return (
      <div className="hx-card hx-result" role="status">
        <p className="hx-eyebrow">Fim da amostra de {questions.length} questões</p>
        <h3>Você acertou {hits} de {questions.length}.</h3>
        <p className="hx-muted">Na área do aluno, cada erro vai para o seu caderno de erros, com a resolução e o motivo do erro mais comum. Aqui nada foi salvo.</p>
        <div className="hx-actions"><button type="button" className="hx-btn" onClick={restart}>Refazer a amostra</button></div>
      </div>
    );
  }

  const chosen = q.options.find((o) => o.id === picked);
  return (
    <div className="hx-card">
      <div className="hx-qhead">
        <p className="hx-eyebrow">Questão {index + 1} de {questions.length} · {q.discLabel} · {q.topic}</p>
        <span className="hx-badge">Amostra</span>
      </div>
      <Html className="hx-rich hx-statement" html={q.statementHtml} />
      <div role="radiogroup" aria-label="Alternativas" className="hx-options">
        {q.options.map((o) => {
          const state = confirmed ? (o.id === q.answer ? "is-correct" : o.id === picked ? "is-wrong" : "") : o.id === picked ? "is-selected" : "";
          return <Option key={o.id} id={o.id} html={o.html} state={state} name={`${group}-${q.id}`} checked={picked === o.id} disabled={confirmed} onChange={() => setPicked(o.id)} />;
        })}
      </div>
      {!confirmed ? (
        <div className="hx-actions">
          <button type="button" className="hx-btn hx-btn-primary" disabled={!picked} onClick={confirm} data-analytics-event="explorer_confirm">Confirmar resposta</button>
        </div>
      ) : (
        <div className={`hx-feedback ${picked === q.answer ? "is-ok" : "is-bad"}`} ref={feedback} tabIndex={-1} role="status">
          <strong>{picked === q.answer ? "Correto!" : `Não foi dessa vez. A correta é a alternativa ${q.answer}.`}</strong>
          {chosen?.why ? <Html className="hx-rich" html={`<strong>Por que a sua escolha não serve: </strong>${chosen.why}`} /> : null}
          <details open>
            <summary>Resolução passo a passo</summary>
            <Html className="hx-rich" html={q.resolutionHtml} />
          </details>
          <p className="hx-misc"><strong>Erro comum:</strong> {q.misconception}</p>
          <div className="hx-actions">
            <button type="button" className="hx-btn hx-btn-primary" onClick={next}>{index >= questions.length - 1 ? "Ver resultado da amostra" : "Próxima questão"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── Simulado ───────── */
function SimuladoDemo({ questions, counts }: { questions: DemoQuestion[]; counts: ExplorerData["counts"] }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);
  const group = useId();
  const q = questions[current];
  if (!q) return null;
  const answered = questions.filter((item) => answers[item.id]).length;
  const reset = () => { setCurrent(0); setAnswers({}); setFlags({}); setFinished(false); };

  if (finished) {
    const byArea = (area: DemoQuestion["area"]) => {
      const list = questions.filter((item) => item.area === area);
      return { total: list.length, hits: list.filter((item) => answers[item.id] === item.answer).length };
    };
    const mat = byArea("Matemática");
    const nat = byArea("Natureza");
    return (
      <div className="hx-card hx-result" role="status">
        <p className="hx-eyebrow">Resultado demonstrativo · amostra de {questions.length} questões</p>
        <h3>{mat.hits + nat.hits} de {questions.length} acertos</h3>
        <ul className="hx-split">
          <li><span>Matemática</span><b>{mat.hits}/{mat.total}</b></li>
          <li><span>Natureza</span><b>{nat.hits}/{nat.total}</b></li>
        </ul>
        <ol className="hx-review">
          {questions.map((item, i) => (
            <li key={item.id} className={answers[item.id] === item.answer ? "is-ok" : "is-bad"}>
              <span>{i + 1}</span>
              <div><strong>{item.discLabel} · {item.topic}</strong><small>Sua resposta: {answers[item.id] || "em branco"} · Gabarito: {item.answer}</small></div>
            </li>
          ))}
        </ol>
        <p className="hx-muted">Isto é apenas uma amostra. O simulado completo tem {counts.simuladoQuestions} questões (45 de Matemática e 45 de Natureza), com cronômetro e correção ao final. Os acertos mostrados não são nota oficial nem TRI.</p>
        <div className="hx-actions"><button type="button" className="hx-btn" onClick={reset}>Refazer a amostra</button></div>
      </div>
    );
  }

  return (
    <div className="hx-card">
      <div className="hx-qhead">
        <p className="hx-eyebrow">Simulado · amostra de {questions.length} questões · {answered} respondidas</p>
        <span className="hx-badge">Amostra</span>
      </div>
      <div className="hx-bar" role="progressbar" aria-label="Respondidas na amostra" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answered}>
        <i style={{ width: `${(answered / questions.length) * 100}%` }} />
      </div>
      <ol className="hx-map" aria-label="Mapa de questões">
        {questions.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              className={`hx-dot ${i === current ? "is-current" : ""} ${answers[item.id] ? "is-done" : ""} ${flags[item.id] ? "is-flag" : ""}`}
              aria-current={i === current ? "true" : undefined}
              aria-label={`Questão ${i + 1}, ${answers[item.id] ? "respondida" : "em branco"}${flags[item.id] ? ", com dúvida" : ""}`}
              onClick={() => setCurrent(i)}
            >
              {i + 1}
            </button>
          </li>
        ))}
      </ol>
      <p className="hx-eyebrow">Questão {current + 1} · {q.discLabel}</p>
      <Html className="hx-rich hx-statement" html={q.statementHtml} />
      <div role="radiogroup" aria-label="Alternativas" className="hx-options">
        {q.options.map((o) => (
          <Option key={o.id} id={o.id} html={o.html} state={answers[q.id] === o.id ? "is-selected" : ""} name={`${group}-${q.id}`} checked={answers[q.id] === o.id} onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))} />
        ))}
      </div>
      <div className="hx-actions">
        <button type="button" className="hx-btn" aria-pressed={Boolean(flags[q.id])} onClick={() => setFlags((f) => ({ ...f, [q.id]: !f[q.id] }))}>{flags[q.id] ? "Dúvida marcada ✓" : "Marcar dúvida"}</button>
        <button type="button" className="hx-btn" disabled={current === 0} onClick={() => setCurrent(current - 1)}>Anterior</button>
        {current < questions.length - 1 ? (
          <button type="button" className="hx-btn hx-btn-primary" onClick={() => setCurrent(current + 1)}>Próxima</button>
        ) : (
          <button type="button" className="hx-btn hx-btn-primary" onClick={() => setFinished(true)} data-analytics-event="explorer_finish">Finalizar amostra</button>
        )}
      </div>
    </div>
  );
}

/* ───────── Minha revisão (plano) ───────── */
const planTasks = [
  { id: "revisar", kind: "Revisar", text: "Razão, proporção e regra de três", meta: "módulo · 25 min" },
  { id: "praticar", kind: "Praticar", text: "10 questões de Matemática", meta: "treino" },
  { id: "entender", kind: "Entender", text: "Refazer as questões do caderno de erros", meta: "revisão" },
  { id: "testar", kind: "Testar", text: "Treino de 20 questões de Natureza", meta: "treino · tempo de referência" },
];

function PlanDemo() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const count = planTasks.filter((t) => done[t.id]).length;
  return (
    <div className="hx-card">
      <div className="hx-qhead">
        <p className="hx-eyebrow">Minha revisão · exemplo de um dia de estudo</p>
        <span className="hx-badge">Exemplo</span>
      </div>
      <h3>{count} de {planTasks.length} atividades</h3>
      <div className="hx-bar" role="progressbar" aria-label="Atividades concluídas no exemplo" aria-valuemin={0} aria-valuemax={planTasks.length} aria-valuenow={count}>
        <i style={{ width: `${(count / planTasks.length) * 100}%` }} />
      </div>
      <ul className="hx-tasks">
        {planTasks.map((t) => (
          <li key={t.id}>
            <label className={done[t.id] ? "is-done" : ""}>
              <input type="checkbox" checked={Boolean(done[t.id])} onChange={() => setDone((d) => ({ ...d, [t.id]: !d[t.id] }))} />
              <span className="hx-check" aria-hidden="true" />
              <span><b>{t.kind}</b> {t.text}<small>{t.meta}</small></span>
            </label>
          </li>
        ))}
      </ul>
      <p className="hx-muted">Na área do aluno, o plano distribui módulos, treinos e revisões pelos dias que faltam, no seu tempo, e o progresso fica salvo.</p>
    </div>
  );
}
