"use client";

import { useEffect, useState } from "react";

/** Botão de compra fixo no celular, com alerta do domingo; some enquanto a seção de planos está na tela. */
export default function StickyBuy({ href, label, alert }: { href: string; label: string; alert?: string }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    // O botão flutuante sai da frente da oferta, da comparação e da demonstração (onde há alternativas e botões de resposta).
    const targets = ["planos", "comparar", "experimentar"].map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el));
    if (!targets.length || !("IntersectionObserver" in window)) return;
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) { if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target); }
      setHidden(visible.size > 0);
    }, { rootMargin: "0px 0px -35% 0px", threshold: 0 });
    targets.forEach((el) => observer.observe(el));
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
