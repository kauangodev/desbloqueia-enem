"use client";

import { useEffect, useState } from "react";

/** Barra de compra do celular: uma única ação, que some quando a oferta ou a amostra ocupam a tela (para não cobrir botões e textos). */
export default function SalesSticky({ href, label, note }: { href: string; label: string; note?: string }) {
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    const ids = ["ofertas", "acesso"];
    const targets = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
    const hero = document.getElementById("topo");
    if (!("IntersectionObserver" in window)) { setHidden(false); return; }
    const visible = new Set<Element>();
    let heroSeen = true;
    const update = () => setHidden(heroSeen || visible.size > 0);
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) heroSeen = entry.isIntersecting && entry.intersectionRatio > 0.55;
        else if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      update();
    }, { rootMargin: "0px 0px -20% 0px", threshold: [0, 0.55] });
    targets.forEach((el) => observer.observe(el));
    if (hero) observer.observe(hero);
    return () => observer.disconnect();
  }, []);
  return (
    <div className={`s-sticky${hidden ? " is-hidden" : ""}`} aria-hidden={hidden}>
      <a className="s-btn" href={href} tabIndex={hidden ? -1 : 0}>{label}</a>
      {note ? <small>{note}</small> : null}
    </div>
  );
}
