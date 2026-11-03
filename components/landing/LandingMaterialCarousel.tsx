"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { materials } from "../../lib/config";

const offsets = [-2, -1, 0, 1, 2] as const;

export function LandingMaterialCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const length = materials.length;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => setActiveIndex((current) => (current + 1) % length), 3600);
    return () => window.clearInterval(timer);
  }, [length, paused, reducedMotion]);

  const visible = useMemo(() => offsets.map((offset) => {
    const index = (activeIndex + offset + length) % length;
    return { item: materials[index], offset };
  }), [activeIndex, length]);
  const active = materials[activeIndex];
  const move = (direction: number) => setActiveIndex((current) => (current + direction + length) % length);

  return (
    <div className="landing-material-carousel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="material-carousel-stage" aria-label="Carrossel dos 16 e-books didáticos">
        {visible.map(({ item, offset }) => (
          <button
            className={`material-carousel-card ${offset === 0 ? "is-active" : ""}`}
            data-offset={offset}
            key={item.id}
            type="button"
            aria-label={`Exibir ${item.title}`}
            aria-current={offset === 0 ? "true" : undefined}
            onClick={() => setActiveIndex(materials.findIndex((entry) => entry.id === item.id))}
          >
            <Image src={item.cover} width={320} height={453} sizes="(max-width: 640px) 48vw, 190px" alt={`Capa do e-book ${item.title}`} />
          </button>
        ))}
        <button className="material-carousel-arrow is-prev" type="button" aria-label="Material anterior" onClick={() => move(-1)}>‹</button>
        <button className="material-carousel-arrow is-next" type="button" aria-label="Próximo material" onClick={() => move(1)}>›</button>
      </div>
      <div className="material-carousel-caption" aria-live="polite">
        <span className="landing-eyebrow">{active.category}</span>
        <h3>{active.title}</h3>
        <p>{active.description}</p>
        <span>{activeIndex + 1} de {length} materiais · {active.pages} páginas</span>
      </div>
      <div className="material-carousel-dots" role="tablist" aria-label="Selecionar material">
        {materials.map((item, index) => (
          <button key={item.id} type="button" role="tab" aria-label={`Material ${index + 1}: ${item.title}`} aria-selected={index === activeIndex} onClick={() => setActiveIndex(index)} />
        ))}
      </div>
    </div>
  );
}

