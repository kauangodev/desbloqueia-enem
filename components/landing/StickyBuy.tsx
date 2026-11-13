"use client";

import { useEffect, useState } from "react";

/** Botão de compra fixo no celular; some enquanto a seção de planos está na tela. */
export default function StickyBuy({ href, label }: { href: string; label: string }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const target = document.getElementById("planos");
    if (!target || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => setHidden(entry.isIntersecting), { threshold: 0.1 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  return (
    <div className={`sticky-buy${hidden ? " is-hidden" : ""}`} aria-hidden={hidden}>
      <a className="ref-button ref-button-primary" href={href} tabIndex={hidden ? -1 : 0}>{label}</a>
      <small>Pix ou cartão · 7 dias de garantia</small>
    </div>
  );
}
