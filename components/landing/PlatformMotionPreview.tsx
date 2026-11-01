"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { materials } from "../../lib/config";

export default function PlatformMotionPreview() {
  const featured = useMemo(() => materials.slice(0, 6), []);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;
    const timer = window.setInterval(() => {
      if (!paused) setActive((current) => (current + 1) % featured.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [featured.length, paused]);

  const material = featured[active];
  return (
    <section className="platform-motion" aria-labelledby="platform-motion-title" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="platform-motion-copy">
        <span className="eyebrow">Uma prévia do seu espaço</span>
        <h3 id="platform-motion-title">Veja a plataforma ganhar vida.</h3>
        <p>Materiais, prática e progresso reunidos em uma experiência feita para você continuar estudando.</p>
        <div className="platform-motion-dots" role="tablist" aria-label="Prévia dos materiais">
          {featured.map((item, index) => (
            <button key={item.id} type="button" role="tab" aria-selected={active === index} aria-label={`Mostrar ${item.title}`} onClick={() => setActive(index)} />
          ))}
        </div>
      </div>
      <div className="platform-motion-window" aria-live="polite">
        <div className="platform-motion-windowbar"><span /><span /><span /><b>GoDev Education · Área do aluno</b></div>
        <div className="platform-motion-layout">
          <aside className="platform-motion-sidebar"><strong>GoDev<span>.</span></strong><i className="is-active">Visão geral</i><i>Meus materiais</i><i>Praticar</i><i>Meu progresso</i></aside>
          <div className="platform-motion-dashboard">
            <div className="platform-motion-heading"><div><small>Seu próximo passo</small><strong>Continue de onde parou.</strong></div><em>ENEM 2026</em></div>
            <div className="platform-motion-stats"><span><b>16</b><small>e-books</small></span><span><b>1.800</b><small>questões</small></span><span><b>72%</b><small>ritmo semanal</small></span></div>
            <div className="platform-motion-feature"><div><small>Material em destaque</small><strong>{material.title}</strong><p>{material.description}</p><button type="button" onClick={() => setActive((active + 1) % featured.length)}>Explorar material</button></div><Image src={material.cover} width={120} height={170} alt={`Capa de ${material.title}`} /></div>
            <div className="platform-motion-progress"><span>Seu ritmo de revisão</span><b><i style={{ width: `${34 + active * 9}%` }} /></b></div>
          </div>
        </div>
      </div>
    </section>
  );
}

