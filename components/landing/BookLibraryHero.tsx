"use client";

import { useEffect, useRef, useState } from "react";
import { interleaved } from "../../lib/covers";
import type { BookScene } from "./hero-library/book-scene";

/**
 * Biblioteca 3D da hero. Aprimoramento progressivo:
 *  1. HTML/SVG estático (SSR) já ocupa o espaço e funciona sem JavaScript, sem WebGL e com movimento reduzido;
 *  2. a cena Three.js carrega depois (ociosidade), apenas se houver WebGL e o usuário não pediu menos movimento;
 *  3. qualquer falha (WebGL, textura, perda de contexto) mantém a composição estática.
 * Elemento decorativo: fora da árvore de acessibilidade; nada essencial depende dele.
 */
const staticCovers = [0, 1, 2, 3, 4, 5, 6].map((i) => interleaved[i]);

type Mode = "static" | "webgl";

function chooseQuality(stageWidth: number) {
  const weak = (navigator.hardwareConcurrency || 4) <= 2 || ((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4) <= 2;
  if (stageWidth >= 640) return { count: weak ? 24 : 32, textureScale: weak ? 0.75 : 1, maxPixelRatio: weak ? 1.25 : 2 };
  if (stageWidth >= 460) return { count: 24, textureScale: 0.75, maxPixelRatio: 1.5 };
  return { count: 16, textureScale: 0.6667, maxPixelRatio: weak ? 1.25 : 1.5 };
}

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") || canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export default function BookLibraryHero() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const scene = useRef<BookScene | null>(null);
  const [mode, setMode] = useState<Mode>("static");
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const element = root.current;
    const container = stage.current;
    if (!element || !container) return;
    const hero = (element.closest(".landing-hero") as HTMLElement | null) ?? element;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    let idle = 0;
    let started = false;

    const teardown = () => {
      observer?.disconnect();
      observer = null;
      scene.current?.dispose();
      scene.current = null;
      delete (element as HTMLElement & { __bookScene?: BookScene }).__bookScene;
      setMode("static");
      setPaused(false);
    };

    const start = async () => {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      // Movimento reduzido: só carrega o 3D onde há ponteiro fino (reação ao cursor do próprio usuário); no toque fica a composição estática.
      if (cancelled || started || (reduce.matches && coarse) || !hasWebGL()) return;
      started = true;
      try {
        const { createBookScene } = await import("./hero-library/book-scene");
        if (cancelled) return;
        const quality = chooseQuality(container.getBoundingClientRect().width);
        const created = await createBookScene({
          container,
          pointerArea: hero,
          count: quality.count,
          textureScale: quality.textureScale,
          maxPixelRatio: quality.maxPixelRatio,
          coarsePointer: coarse,
          reduced: reduce.matches,
          onReady: () => { if (!cancelled) setMode("webgl"); },
          onFail: () => { if (!cancelled) teardown(); },
        });
        if (!created) return;
        if (cancelled) { created.dispose(); return; }
        scene.current = created;
        (element as HTMLElement & { __bookScene?: BookScene }).__bookScene = created; // gancho de verificação
        observer = new IntersectionObserver(([entry]) => scene.current?.setVisible(entry.isIntersecting), { threshold: 0.05 });
        observer.observe(element);
      } catch {
        if (!cancelled) teardown();
      }
    };

    // O 3D é aprimoramento: espera a página assentar (load + ~1,8 s) e a ociosidade, para não competir com título, CTA e quiz.
    const schedule = () => {
      const run = () => { void start(); };
      idle = globalThis.setTimeout(() => {
        const w = window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
        if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 1500 }); else run();
      }, 1800) as unknown as number;
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    const onReduceChange = () => {
      // Mudou a preferência: reinicia a cena com o modo correto.
      started = false;
      teardown();
      schedule();
    };
    reduce.addEventListener("change", onReduceChange);

    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
      reduce.removeEventListener("change", onReduceChange);
      if (idle) globalThis.clearTimeout(idle);
      observer?.disconnect();
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  function toggle() {
    const next = !paused;
    setPaused(next);
    scene.current?.setPaused(next);
  }

  return (
    <div className="hl" data-mode={mode} data-paused={paused ? "true" : "false"} ref={root}>
      <div className="hl-stage" ref={stage} aria-hidden="true">
        <div className="hl-static">
          {staticCovers.map((cover, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={cover.id} className="hl-book" style={{ ["--i" as string]: index } as React.CSSProperties} src={`/books/cover-${cover.id}.svg`} alt="" width={384} height={576} loading="eager" fetchPriority="low" decoding="async" draggable={false} />
          ))}
        </div>
      </div>
      <p className="hl-caption">Capas ilustrativas dos temas de revisão de Matemática, Física, Química e Biologia.</p>
      <div className="hl-pause-slot">
        {mode === "webgl" ? (
          <button type="button" className="hl-pause" aria-pressed={paused} onClick={toggle}>
            {paused ? "Retomar animação" : "Pausar animação"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
