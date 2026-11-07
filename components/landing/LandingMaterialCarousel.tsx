"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { materials } from "../../lib/config";

/** No desktop mostra três capas completas (central em destaque); no celular, uma por vez. Sem avanço automático. */
const offsets = [-1, 0, 1] as const;

export function LandingMaterialCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const pointerStart = useRef<number | null>(null);
  const pointerMoved = useRef(false);
  const length = materials.length;

  const visible = offsets.map((offset) => ({ item: materials[(activeIndex + offset + length) % length], offset }));
  const active = materials[activeIndex];
  const move = (direction: number) => setActiveIndex((current) => (current + direction + length) % length);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse") return;
    pointerStart.current = event.clientX;
    pointerMoved.current = false;
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (pointerStart.current === null) return;
    pointerMoved.current = Math.abs(event.clientX - pointerStart.current) > 8;
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (pointerStart.current === null) return;
    const delta = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (!pointerMoved.current || Math.abs(delta) < 42) return;
    move(delta < 0 ? 1 : -1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
  }

  return (
    <div
      className="landing-material-carousel"
      role="region"
      aria-roledescription="carrossel"
      aria-label="E-books didáticos"
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { pointerStart.current = null; }}
    >
      <div className="material-carousel-stage">
        <button className="material-carousel-arrow is-prev" type="button" aria-label="Material anterior" onClick={() => move(-1)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="material-carousel-track">
          {visible.map(({ item, offset }) => (
            <button
              className={`material-carousel-card ${offset === 0 ? "is-active" : ""}`}
              data-offset={offset}
              key={item.id}
              type="button"
              aria-label={offset === 0 ? `${item.title} (selecionado)` : `Exibir ${item.title}`}
              aria-current={offset === 0 ? "true" : undefined}
              tabIndex={offset === 0 ? 0 : -1}
              onClick={() => setActiveIndex(materials.findIndex((entry) => entry.id === item.id))}
            >
              <Image src={item.cover} width={320} height={453} sizes="(max-width: 640px) 60vw, 210px" alt={`Capa do e-book ${item.title}`} />
            </button>
          ))}
        </div>
        <button className="material-carousel-arrow is-next" type="button" aria-label="Próximo material" onClick={() => move(1)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="m9 18 6-6-6-6" /></svg>
        </button>
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
