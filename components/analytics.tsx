"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { META_PIXEL_ID, trackMetaEvent } from "../lib/meta-pixel";
import { OPEN_CONSENT_EVENT, readConsent, saveConsent } from "../lib/consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __godevMetaPixelInitialized?: string;
  }
}

function loadMetaPixel(pixel: string) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__godevMetaPixelInitialized === pixel) return;

  // Keep one initialization per page even if React remounts this component or
  // an already loaded script is reused during client navigation.
  if (window.fbq) {
    // A provider/extension may have initialized fbq before this component.
    // Reusing it is safer than issuing a second init and creating conflicting
    // pixel versions in a persistent browser session.
    window.__godevMetaPixelInitialized = pixel;
    return;
  }

  const f = ((...args: unknown[]) => {
    if (f.callMethod) f.callMethod(...args);
    else f.queue?.push(args);
  }) as NonNullable<Window["fbq"]>;
  f.queue = [];
  f.loaded = true;
  f.version = "2.0";
  window.fbq = f;

  if (!document.querySelector('script[data-analytics="meta-pixel"]')) {
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.async = true;
    script.dataset.analytics = "meta-pixel";
    document.head.appendChild(script);
  }
  window.fbq("init", pixel);
  window.__godevMetaPixelInitialized = pixel;
}

export default function Analytics() {
  // "loading": ainda lendo a preferência (nada é exibido, evitando o flash do aviso); null: sem escolha válida.
  const [choice, setChoice] = useState<"loading" | "accepted" | "rejected" | null>("loading");
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [metrics, setMetrics] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPageRef = useRef<string | null>(null);
  const lastHeroRef = useRef<string | null>(null);
  const pixel = META_PIXEL_ID;
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  const pageKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    const stored = readConsent();
    setChoice(stored ? (stored.analytics ? "accepted" : "rejected") : null);
    setOpen(!stored);
    setMetrics(Boolean(stored?.analytics));
  }, []);

  // Reabertura voluntária pelo link "Preferências de cookies".
  useEffect(() => {
    const reopen = () => { returnFocus.current = document.activeElement as HTMLElement | null; setCustom(true); setOpen(true); };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  // Reserva espaço no fim da página enquanto o aviso está aberto: nenhuma ação (ex.: "Continuar" do quiz) fica atrás dele.
  useEffect(() => {
    if (!open || choice === "loading") return;
    const root = document.documentElement;
    const apply = () => { const h = panelRef.current?.offsetHeight ?? 0; root.style.setProperty("--consent-h", h ? `${h + 24}px` : "0px"); };
    apply();
    const observer = typeof ResizeObserver !== "undefined" && panelRef.current ? new ResizeObserver(apply) : null;
    if (observer && panelRef.current) observer.observe(panelRef.current);
    return () => { observer?.disconnect(); root.style.removeProperty("--consent-h"); };
  }, [open, choice]);
  useEffect(() => {
    if (open && choice !== "loading") { const id = requestAnimationFrame(() => panelRef.current?.focus()); return () => cancelAnimationFrame(id); }
  }, [open, choice]);

  useEffect(() => {
    if (choice !== "accepted") return;

    if (/^\d+$/.test(pixel)) {
      loadMetaPixel(pixel);
      if (lastPageRef.current !== pageKey) {
        trackMetaEvent("PageView");
        lastPageRef.current = pageKey;
      }
    }

    const heroVariant = document.querySelector<HTMLElement>("[data-hero-variant]")?.dataset.heroVariant;
    const heroKey = `${pageKey}:${heroVariant || "none"}`;
    if (heroVariant && (heroVariant === "a" || heroVariant === "b") && lastHeroRef.current !== heroKey) {
      trackMetaEvent("ViewContent", { content_name: "hero_variant", variant: heroVariant });
      window.gtag?.("event", "hero_variant_view", { hero_variant: heroVariant });
      lastHeroRef.current = heroKey;
    }

    if (ga && /^G-[A-Z0-9]+$/i.test(ga) && !window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = (...args) => window.dataLayer?.push(args);
      window.gtag("js", new Date());
      window.gtag("config", ga, { anonymize_ip: true });
      const script = document.createElement("script");
      script.src = `https://www.googletagmanager.com/gtag/js?id=${ga}`;
      script.async = true;
      script.dataset.analytics = "google-analytics";
      document.head.appendChild(script);
    }

    const url = new URL(location.href);
    const utm: Record<string, string> = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
      const value = url.searchParams.get(key);
      if (value) utm[key] = value.slice(0, 120);
    }
    if (Object.keys(utm).length) sessionStorage.setItem("godev-utm", JSON.stringify(utm));

    const click = (event: MouseEvent) => {
      const anchor = (event.target as Element).closest("a");
      const tracked = (event.target as Element).closest<HTMLElement>("[data-analytics-event]")?.dataset.analyticsEvent;
      if (tracked) {
        const eventName = tracked.includes("checkout") || tracked === "hero_primary_cta" ? "InitiateCheckout" : "ViewContent";
        trackMetaEvent(eventName, { content_name: tracked });
        window.gtag?.("event", tracked);
      }
      if (anchor?.getAttribute("href")?.startsWith("/api/checkout/")) {
        trackMetaEvent("InitiateCheckout", { content_name: "Desbloqueia ENEM 2026" });
        window.gtag?.("event", "begin_checkout");
      }
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, [choice, ga, pageKey, pixel]);

  function close() { setOpen(false); setCustom(false); const el = returnFocus.current; returnFocus.current = null; if (el && document.contains(el)) el.focus(); }

  function choose(value: "accepted" | "rejected") {
    saveConsent(value === "accepted");
    setChoice(value);
    setMetrics(value === "accepted");
    close();
    if (value === "rejected") {
      sessionStorage.removeItem("godev-utm");
      window.fbq?.("consent", "revoke");
      window.gtag?.("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
      });
      document.querySelectorAll("script[data-analytics]").forEach((script) => script.remove());
      delete window.fbq;
      delete window.gtag;
      delete window.__godevMetaPixelInitialized;
    }
  }

  if (!pixel && !ga) return null;
  if (!open || choice === "loading") return null;
  return (
    <div className="consent" aria-labelledby="consent-title" role="dialog" aria-modal="false" tabIndex={-1} ref={panelRef} onKeyDown={(e) => { if (e.key === "Escape" && choice !== null) close(); }}>
      <b id="consent-title">Seu estudo, sua escolha.</b>
      <p>Usamos cookies essenciais para o acesso funcionar. Métricas opcionais ajudam a melhorar a experiência e só são ativadas se você permitir.</p>
      {custom ? (
        <fieldset className="consent-options">
          <legend className="sr-only">Categorias de cookies</legend>
          <label><input type="checkbox" checked disabled /> <span><strong>Essenciais</strong> — login, segurança e preferências. Sempre ativos.</span></label>
          <label><input type="checkbox" checked={metrics} onChange={(e) => setMetrics(e.target.checked)} /> <span><strong>Métricas opcionais</strong> — medição de acessos e campanhas.</span></label>
        </fieldset>
      ) : null}
      <div>
        {custom ? (
          <>
            <button type="button" className="button secondary" onClick={() => choose(metrics ? "accepted" : "rejected")}>Salvar escolha</button>
            {choice !== null ? <button type="button" className="button secondary" onClick={close}>Cancelar</button> : <button type="button" className="button secondary" onClick={() => setCustom(false)}>Voltar</button>}
          </>
        ) : (
          <>
            <button type="button" className="button secondary" onClick={() => choose("rejected")}>Só essenciais</button>
            <button type="button" className="button secondary" onClick={() => setCustom(true)}>Personalizar</button>
            <button type="button" className="button primary" onClick={() => choose("accepted")}>Permitir métricas</button>
          </>
        )}
      </div>
    </div>
  );
}
