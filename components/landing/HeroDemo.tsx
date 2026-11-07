"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Demonstração gravada da plataforma (fluxo real da demo pública: abrir questão, marcar alternativa,
 * avançar e ver a correção). Mudo, sem áudio, com poster estático, pausa acessível e fallback.
 * Só reproduz quando visível; em prefers-reduced-motion exibe o poster até o usuário pedir.
 */
export function HeroDemo() {
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [failed, setFailed] = useState(false);
  const [inView, setInView] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [userStarted, setUserStarted] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const node = frame.current;
    if (!node || typeof IntersectionObserver === "undefined") { setInView(true); return; }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const shouldPlay = !failed && !userPaused && inView && (!reduced || userStarted);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (!shouldPlay) { element.pause(); return; }
    element.play().catch(() => setPlaying(false));
  }, [shouldPlay]);

  function toggle() {
    const element = video.current;
    if (!element) return;
    if (playing) {
      setUserPaused(true);
      element.pause();
    } else {
      setUserPaused(false);
      setUserStarted(true);
      element.play().catch(() => setFailed(true));
    }
  }

  return (
    <figure className="hero-demo" aria-label="Demonstração gravada da plataforma">
      <div className="hero-demo__frame" ref={frame}>
        <video
          ref={video}
          muted
          loop
          playsInline
          preload="none"
          poster="/demo/hero-demo-poster.webp"
          width={600}
          height={580}
          aria-describedby="hero-demo-description"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setFailed(true)}
        >
          <source src="/demo/hero-demo.webm" type="video/webm" />
        </video>
      </div>
      <p id="hero-demo-description" className="sr-only">
        Gravação curta, sem áudio: uma questão é aberta, uma alternativa é selecionada, o estudante avança por cinco questões e vê o resultado com a correção de cada uma.
      </p>
      <figcaption>
        <span>Demonstração gravada · questões de exemplo</span>
        <button type="button" className="hero-demo__control" onClick={toggle}>
          {playing ? "Pausar demonstração" : "Reproduzir demonstração"}
        </button>
      </figcaption>
    </figure>
  );
}
