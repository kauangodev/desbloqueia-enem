"use client";

import { useEffect, useState } from "react";

/** Botão de compra fixo no celular, com alerta do domingo; some enquanto a seção de planos está na tela. */
export default function StickyBuy({ href, label, alert }: { href: string; label: string; alert?: string }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const target = document.getElementById("planos");
    if (!target || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setHidden(entry.isIntersecting), { rootMargin: "0px 0px -35% 0px", threshold: 0 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  return (
    <div className={`sticky-buy${hidden ? " is-hidden" : ""}`} aria-hidden={hidden}>
      {alert ? <p className="sticky-alert"><i aria-hidden="true" />{alert}</p> : null}
      <a className="ref-button ref-button-primary ref-button-hot" href={href} tabIndex={hidden ? -1 : 0}>{label}</a>
      <small>Pix ou cartão · 7 dias de garantia</small>
    </div>
  );
}
