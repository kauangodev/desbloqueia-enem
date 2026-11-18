"use client";

import { useEffect } from "react";
import { trackBusiness } from "../../lib/funnel/client";

/**
 * Eventos da landing que não pertencem a um componente só: planos vistos (a seção de planos entrou na tela, uma vez por página)
 * e início de cadastro (clique em qualquer botão marcado com data-signup). Tudo só com consentimento de métricas.
 */
export default function LandingEvents() {
  useEffect(() => {
    trackBusiness("landing_viewed", {}, { once: true });
    const click = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>("[data-signup]");
      if (target) trackBusiness("signup_started", {}, { once: false });
    };
    document.addEventListener("click", click);
    const offers = document.getElementById("ofertas");
    let observer: IntersectionObserver | null = null;
    if (offers && "IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        trackBusiness("plans_viewed", {}, { once: true });
        observer?.disconnect();
      }, { threshold: 0.25 });
      observer.observe(offers);
    }
    return () => { document.removeEventListener("click", click); observer?.disconnect(); };
  }, []);
  return null;
}