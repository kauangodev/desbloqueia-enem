"use client";

import { useEffect } from "react";

/**
 * Atribuição de campanha: guarda utm_* e fbclid da visita e os repassa ao checkout (/api/checkout/...) no clique.
 * Sem isso, a Cakto e o Meta não sabem de qual anúncio veio a compra. Só repassa chaves conhecidas, com tamanho limitado.
 */
const KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "src", "sck"] as const;
const STORE = "godev-attribution";

function readStored(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(STORE) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export default function CheckoutParams() {
  useEffect(() => {
    const incoming = new URLSearchParams(window.location.search);
    const saved = readStored();
    let changed = false;
    for (const key of KEYS) {
      const value = incoming.get(key);
      if (value && value.length <= 200 && saved[key] !== value) { saved[key] = value; changed = true; }
    }
    if (changed) {
      try { sessionStorage.setItem(STORE, JSON.stringify(saved)); } catch { /* armazenamento indisponível: segue sem atribuição */ }
    }

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a[href^='/api/checkout/']") as HTMLAnchorElement | null;
      if (!anchor) return;
      const params = readStored();
      const url = new URL(anchor.getAttribute("href") || "", window.location.origin);
      for (const key of KEYS) if (params[key] && !url.searchParams.has(key)) url.searchParams.set(key, params[key]);
      anchor.setAttribute("href", url.pathname + url.search);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
