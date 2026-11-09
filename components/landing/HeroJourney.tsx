"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Demonstração interativa da jornada de estudo: Revisar → Praticar → Entender → Avançar.
 * Usa dados de EXEMPLO (rotulados como tal): nada aqui representa o progresso do visitante.
 * Título e CTA do hero não dependem deste componente; o bloco tem altura fixa (sem deslocamento de layout).
 * Avança sozinho uma única volta enquanto visível; qualquer interação ou "Pausar" encerra o avanço automático.
 * Com prefers-reduced-motion não há avanço automático nem inclinação por ponteiro.
 */
const steps = [
  { id: "revisar", label: "Revisar", hint: "Material objetivo" },
  { id: "praticar", label: "Praticar", hint: "Questão no estilo ENEM" },
  { id: "entender", label: "Entender", hint: "Resolução em etapas" },
  { id: "avancar", label: "Avançar", hint: "Meta e progresso" },
] as const;

const options = [
  { id: "A", text: "R$ 72,00" },
  { id: "B", text: "R$ 76,00" },
  { id: "C", text: "R$ 80,00" },
  { id: "D", text: "R$ 84,00" },
];

export function HeroJourney() {
  const root = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [auto, setAuto] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [inView, setInView] = useState(false);
  const [loops, setLoops] = useState(0);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node || typeof IntersectionObserver === "undefined") { setInView(true); return; }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.4 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const running = auto && !reduced && inView && loops < 1;
  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => {
      if (step === steps.length - 1) { setLoops((n) => n + 1); setStep(0); setPicked(null); }
      else { setStep((s) => s + 1); if (step === 1) setPicked("C"); }
    }, 4200);
    return () => clearTimeout(id);
  }, [running, step]);

  // Resposta sutil ao ponteiro (apenas ponteiro fino, sem preferência por movimento reduzido).
  useEffect(() => {
    const node = root.current;
    if (!node || reduced || !window.matchMedia("(pointer: fine)").matches) return;
    let frame = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = node.getBoundingClientRect();
        node.style.setProperty("--tilt-x", `${(((e.clientX - r.left) / r.width) - 0.5) * 4}deg`);
        node.style.setProperty("--tilt-y", `${(((e.clientY - r.top) / r.height) - 0.5) * -4}deg`);
      });
    };
    const leave = () => { node.style.setProperty("--tilt-x", "0deg"); node.style.setProperty("--tilt-y", "0deg"); };
    node.addEventListener("pointermove", move); node.addEventListener("pointerleave", leave);
    return () => { cancelAnimationFrame(frame); node.removeEventListener("pointermove", move); node.removeEventListener("pointerleave", leave); };
  }, [reduced]);

  const go = (index: number) => { setAuto(false); setStep(index); };
  const choose = (id: string) => { setAuto(false); setPicked(id); setStep(2); };
  const correct = picked === "C";

  return (
    <figure className="hero-journey" ref={root} aria-label="Demonstração interativa da jornada de estudo, com dados de exemplo">
      <div className="hero-journey__steps" role="tablist" aria-label="Etapas da jornada">
        {steps.map((s, i) => (
          <button key={s.id} type="button" role="tab" id={`hj-tab-${s.id}`} aria-selected={step === i} aria-controls="hj-panel" className={`hero-journey__step ${step === i ? "is-on" : ""} ${i < step ? "is-past" : ""}`} onClick={() => go(i)}>
            <span className="hero-journey__row"><span className="hero-journey__num" aria-hidden="true">{i + 1}</span><strong>{s.label}</strong></span>
            <small>{s.hint}</small>
          </button>
        ))}
      </div>
      <div className="hero-journey__stage" id="hj-panel" role="tabpanel" aria-labelledby={`hj-tab-${steps[step].id}`} aria-live="off">
        <span className="hero-journey__badge">Exemplo ilustrativo</span>
        {step === 0 ? (
          <div className="hj-card" key="s0">
            <p className="hj-eyebrow">Módulo · Matemática · 25 min</p>
            <p className="hj-title">Porcentagem e variações percentuais</p>
            <p>Calcule aumentos e descontos sucessivos sem confundir pontos percentuais com porcentagem.</p>
            <ul><li>Fator de variação: aumento de 25% → ×1,25</li><li>Descontos sucessivos multiplicam os fatores</li><li>Erros comuns e exemplos resolvidos</li></ul>
          </div>
        ) : null}
        {step === 1 ? (
          <div className="hj-card" key="s1">
            <p className="hj-eyebrow">Questão no estilo ENEM · exemplo</p>
            <p className="hj-statement">Um produto de R$ 80,00 sofre aumento de 25% e, depois, desconto de 20% sobre o novo preço. O preço final é de</p>
            <div className="hj-options" role="group" aria-label="Alternativas de exemplo">
              {options.map((o) => <button key={o.id} type="button" className={`hj-option ${picked === o.id ? "is-picked" : ""}`} onClick={() => choose(o.id)}><b>{o.id}</b>{o.text}</button>)}
            </div>
            <p className="hj-note">Toque numa alternativa para ver a resolução.</p>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="hj-card" key="s2">
            <p className="hj-eyebrow">{picked ? (correct ? "Correto" : "Quase lá — veja o caminho") : "Resolução em etapas"}</p>
            <p className="hj-title">Resposta: R$ 80,00</p>
            <ol><li>Aumento de 25%: 80 × 1,25 = 100</li><li>Desconto de 20%: 100 × 0,80 = 80</li></ol>
            <p className="hj-warn"><b>Erro comum:</b> somar +25% e −20% como se fosse +5%.</p>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="hj-card" key="s3">
            <p className="hj-eyebrow">Meta diária · exemplo</p>
            <p className="hj-title">2 de 3 atividades</p>
            <div className="hj-bar" role="progressbar" aria-label="Meta diária de exemplo" aria-valuemin={0} aria-valuemax={3} aria-valuenow={2}><i /></div>
            <p>Módulo concluído e 1 questão corrigida. <strong>Próximo:</strong> Gráficos e tabelas.</p>
            <p className="hj-note">O seu progresso real aparece na área do aluno, depois do acesso.</p>
          </div>
        ) : null}
      </div>
      <figcaption>
        <span>Demonstração com dados de exemplo</span>
        {running ? <button type="button" className="hero-journey__control" onClick={() => setAuto(false)}>Pausar avanço automático</button> : null}
      </figcaption>
    </figure>
  );
}
