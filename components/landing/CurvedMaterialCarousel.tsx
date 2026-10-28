"use client";

import Image from "next/image";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { heroMaterials } from "./hero-data";
import styles from "./reel-hero.module.css";

const carouselItems = [...heroMaterials, ...heroMaterials];

type MotionState = {
  offset: number;
  velocity: number;
  width: number;
  height: number;
  visible: boolean;
  hidden: boolean;
  reduced: boolean;
  dragging: boolean;
  pointerId: number | null;
  lastX: number;
  lastTime: number;
};

const initialMotion: MotionState = {
  offset: 0,
  velocity: 0,
  width: 0,
  height: 0,
  visible: true,
  hidden: false,
  reduced: false,
  dragging: false,
  pointerId: null,
  lastX: 0,
  lastTime: 0,
};

export function CurvedMaterialCarousel() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const motionRef = useRef<MotionState>({ ...initialMotion });

  const renderCards = useCallback(() => {
    const motion = motionRef.current;
    if (!motion.width || !motion.height) return;

    const mobile = motion.width < 820;
    const spacing = mobile
      ? Math.max(118, Math.min(150, motion.width * 0.36))
      : Math.max(164, Math.min(196, motion.width * 0.136));
      const centerWidth = mobile
      ? Math.max(112, Math.min(132, motion.width * 0.31))
      : 152;
    const centerHeight = mobile ? 188 : 228;
    const extraWidth = mobile ? 24 : 34;
    const extraHeight = mobile ? 34 : 62;
    const radius = Math.max(motion.width * 0.5, 1);
    const total = carouselItems.length * spacing;
    const centerY = motion.height * (mobile ? 0.51 : 0.53);

    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const base = (index - carouselItems.length / 2) * spacing;
      const wrapped =
        ((((base + motion.offset + total / 2) % total) + total) % total) -
        total / 2;
      const normalized = Math.min(Math.abs(wrapped) / radius, 1.15);
      const curve = Math.min(normalized, 1);
      const distributed =
        wrapped * (1 + 0.083 * Math.pow(wrapped / Math.max(radius, 1), 2));
      const cardWidth = centerWidth + extraWidth * curve * curve;
      const cardHeight =
        centerHeight + extraHeight * Math.pow(curve, mobile ? 2.2 : 2.6);
      const x = motion.width / 2 + distributed - cardWidth / 2;
      const y = centerY - 12 * curve * curve - cardHeight / 2;
      const rotateY = Math.max(-14, Math.min(14, -wrapped / radius * 14));
      const rotateZ = Math.max(-2.2, Math.min(2.2, wrapped / radius * 2.2));

      card.style.cssText = [
        `width:${cardWidth}px`,
        `height:${cardHeight}px`,
        `transform:translate3d(${x}px,${y}px,0) perspective(1100px) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
        `z-index:${Math.round(100 - curve * 60)}`,
        `opacity:${Math.max(0.34, 1 - Math.max(0, normalized - 0.72) * 1.25)}`,
      ].join(";");
    });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const motion = motionRef.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateSize = () => {
      const bounds = viewport.getBoundingClientRect();
      motion.width = bounds.width;
      motion.height = bounds.height;
      // ResizeObserver can run before IntersectionObserver has delivered its
      // first entry. Keep the visible default until the observer has a real
      // answer; otherwise a desktop first paint could start frozen forever.
      if (document.visibilityState === "visible") motion.visible = true;
      renderCards();
    };
    const updateMotionPreference = () => {
      motion.reduced = media.matches;
      motion.velocity = 0;
      renderCards();
    };
    const updateVisibility = () => {
      motion.hidden = document.hidden;
      previousTimeRef.current = null;
    };

    const resizeObserver = new ResizeObserver(updateSize);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        motion.visible = entry.isIntersecting;
        previousTimeRef.current = null;
      },
      { rootMargin: "120px" },
    );
    resizeObserver.observe(viewport);
    intersectionObserver.observe(viewport);
    media.addEventListener("change", updateMotionPreference);
    document.addEventListener("visibilitychange", updateVisibility);
    updateMotionPreference();
    updateSize();

    const animate = (time: number) => {
      const previous = previousTimeRef.current ?? time;
      const delta = Math.min((time - previous) / 1000, 0.05);
      previousTimeRef.current = time;

      const pageVisible = document.visibilityState === "visible";
      // Keep the hero loop running whenever the page is visible. The
      // previous intersection gate could leave desktop cards frozen after the
      // first layout/visibility race; reduced-motion and hidden-tab safeguards
      // remain respected.
      if (pageVisible && !motion.hidden && !motion.reduced && motion.width > 0) {
        if (!motion.dragging) {
          if (Math.abs(motion.velocity) > 5) {
            motion.offset += motion.velocity * delta;
            motion.velocity *= Math.pow(0.055, delta);
          } else {
            motion.velocity = 0;
            // Keep the idle movement frame-rate independent. The modulo in
            // renderCards handles the circular wrap without letting offset
            // grow indefinitely during a long desktop session.
            // Move left-to-right in an endless circular track. The duplicated
            // item set and modulo wrapping keep the motion seamless.
            motion.offset += 50 * delta;
          }
          renderCards();
        }
      }
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      media.removeEventListener("change", updateMotionPreference);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, [renderCards]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const motion = motionRef.current;
    motion.dragging = true;
    motion.pointerId = event.pointerId;
    motion.velocity = 0;
    motion.lastX = event.clientX;
    motion.lastTime = performance.now();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const motion = motionRef.current;
    if (!motion.dragging || motion.pointerId !== event.pointerId) return;
    const now = performance.now();
    const deltaX = event.clientX - motion.lastX;
    const deltaTime = Math.max((now - motion.lastTime) / 1000, 0.008);
    motion.offset += deltaX;
    motion.velocity = Math.max(-1800, Math.min(1800, deltaX / deltaTime));
    motion.lastX = event.clientX;
    motion.lastTime = now;
    renderCards();
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const motion = motionRef.current;
    if (!motion.dragging || motion.pointerId !== event.pointerId) return;
    motion.dragging = false;
    motion.pointerId = null;
    if (motion.reduced) motion.velocity = 0;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const nudge = (direction: -1 | 1) => {
    const motion = motionRef.current;
    motion.offset += direction * 180;
    motion.velocity = direction * 420;
    renderCards();
  };

  return (
    <div
      ref={viewportRef}
      className={styles.carousel}
      aria-label="Capas dos materiais do Desbloqueia ENEM 2026"
      role="region"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
    >
      <p className="sr-only">
        Coleção animada com os materiais reais de revisão. Arraste na horizontal
        para explorar as capas.
      </p>
      {carouselItems.map((material, index) => {
        const duplicate = index >= heroMaterials.length;
        return (
          <figure
            className={styles.card}
            data-carousel-card
            key={`${material.id}-${index}`}
            ref={(node) => {
              cardRefs.current[index] = node;
            }}
            aria-hidden={duplicate || undefined}
          >
            <div className={styles.cardImage}>
              <Image
                src={material.image}
                alt={duplicate ? "" : material.description}
                fill
                sizes="(max-width: 820px) 180px, 240px"
                draggable={false}
                priority={index < 7}
              />
            </div>
            <figcaption>
              <span>{material.subject}</span>
              <b>{material.title}</b>
            </figcaption>
          </figure>
        );
      })}
      <button
        className={`${styles.arrow} ${styles.arrowPrevious}`}
        type="button"
        aria-label="Materiais anteriores"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => nudge(-1)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <button
        className={`${styles.arrow} ${styles.arrowNext}`}
        type="button"
        aria-label="Próximos materiais"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => nudge(1)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
      </button>
    </div>
  );
}



