"use client";

import { useEffect, useState } from "react";

/**
 * Barra de ação do celular: uma única ação. Fica escondida enquanto o topo (promessa + questão) está na tela, para não cobrir a
 * demonstração, e some de novo sobre os planos e o acesso (que já têm seus próprios botões).
 */
export default function SalesSticky({ href, label, note, signup }: { href: string; label: string; note?: string; signup?: boolean }) {
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    const hero = document.getElementById("topo");
    const targets = ["ofertas", "acesso"].map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
    if (!("IntersectionObserver" in window) || !hero) { setHidden(false); return; }
    const visible = new Set<Element>();
    let heroOn = true;
    const update = () => setHidden(heroOn || visible.size > 0);
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) heroOn = entry.isIntersecting; // qualquer parte do topo na tela já basta para esconder
        else if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      update();
    }, { rootMargin: "0px 0px -20% 0px", threshold: [0, 0.01] });
    targets.forEach((el) => observer.observe(el));
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);
  return (
    <div className={`s-sticky${hidden ? " is-hidden" : ""}`} aria-hidden={hidden}>
      <a className="s-btn" href={href} tabIndex={hidden ? -1 : 0} data-signup={signup ? "sticky" : undefined}>{label}</a>
      {note ? <small>{note}</small> : null}
    </div>
  );
}