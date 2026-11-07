"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Cover = { src: string; title: string };

const INTERVAL_MS = 4200;

/**
 * Vitrine animada da hero: pilha de capas reais dos e-books que se alternam e um
 * painel de estudo de demonstração. Só anima transform/opacity; pausa fora da tela,
 * com a aba oculta, no hover/foco e em prefers-reduced-motion; há controle de pausa.
 */
export function HeroStage({ covers }: { covers: Cover[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [active, setActive] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const total = covers.length;
  const running = !userPaused && !hovering && inView && tabVisible && !reduced;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const node = stageRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.25 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!running || total < 2) return;
    const id = window.setInterval(() => setActive((index) => (index + 1) % total), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [running, total]);

  useEffect(() => () => window.cancelAnimationFrame(frame.current), []);

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduced || userPaused || event.pointerType !== "mouse") return;
    const node = stageRef.current;
    if (!node) return;
    const { clientX, clientY } = event;
    window.cancelAnimationFrame(frame.current);
    frame.current = window.requestAnimationFrame(() => {
      const rect = node.getBoundingClientRect();
      node.style.setProperty("--mx", String(((clientX - rect.left) / rect.width - 0.5) * 2));
      node.style.setProperty("--my", String(((clientY - rect.top) / rect.height - 0.5) * 2));
    });
  }

  function onPointerLeave() {
    setHovering(false);
    const node = stageRef.current;
    if (node) {
      node.style.setProperty("--mx", "0");
      node.style.setProperty("--my", "0");
    }
  }

  return (
    <div
      ref={stageRef}
      className="hero-stage"
      data-running={running ? "true" : "false"}
      role="group"
      aria-label="Prévia animada: e-books da plataforma e painel de estudo"
      onPointerEnter={(event) => event.pointerType === "mouse" && setHovering(true)}
      onPointerLeave={onPointerLeave}
      onPointerMove={onPointerMove}
    >
      <div className="hero-stage__glow" aria-hidden="true" />

      <ul className="hero-stage__deck">
        {covers.map((cover, index) => {
          const position = (index - active + total) % total;
          return (
            <li key={cover.src} className={`hero-cover pos-${Math.min(position, 3)}`} aria-hidden={position !== 0}>
              <Image
                src={cover.src}
                alt={position === 0 ? `Capa do e-book ${cover.title}` : ""}
                width={320}
                height={480}
                sizes="(max-width: 640px) 46vw, 240px"
                priority={index === 0}
              />
            </li>
          );
        })}
      </ul>

      <span className="hero-chip" key={covers[active]?.title} aria-hidden="true">
        {covers[active]?.title} · e-book
      </span>

      <div className="hero-card hero-card--progress" aria-hidden="true">
        <small>Exemplo de demonstração</small>
        <strong>Questão 3 de 5</strong>
        <div className="hero-bar"><span /></div>
        <div className="hero-status">
          <span className="s1">Escolha uma alternativa</span>
          <span className="s2">Resposta registrada</span>
        </div>
      </div>

      <div className="hero-card hero-card--xp" aria-hidden="true">
        <span className="hero-xp-plus">+10 XP</span>
        <small>progresso do estudo</small>
      </div>

      {!reduced && (
        <button type="button" className="hero-stage__pause" aria-pressed={userPaused} onClick={() => setUserPaused((value) => !value)}>
          {userPaused ? "Retomar animação" : "Pausar animação"}
        </button>
      )}
    </div>
  );
}
