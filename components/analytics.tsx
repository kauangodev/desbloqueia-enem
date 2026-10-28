"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { META_PIXEL_ID, trackMetaEvent } from "../lib/meta-pixel";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function loadMetaPixel(pixel: string) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.fbq) return;

  const f = ((...args: unknown[]) => {
    if (f.callMethod) f.callMethod(...args);
    else f.queue?.push(args);
  }) as NonNullable<Window["fbq"]>;
  f.queue = [];
  f.loaded = true;
  f.version = "2.0";
  window.fbq = f;

  const script = document.createElement("script");
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  script.async = true;
  script.dataset.analytics = "meta-pixel";
  document.head.appendChild(script);
  window.fbq("init", pixel);
}

export default function Analytics() {
  const [choice, setChoice] = useState<string | null>("loading");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPageRef = useRef<string | null>(null);
  const pixel = META_PIXEL_ID;
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  const pageKey = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    setChoice(localStorage.getItem("godev-consent"));
  }, []);

  useEffect(() => {
    if (choice !== "accepted") return;

    if (/^\d+$/.test(pixel)) {
      loadMetaPixel(pixel);
      if (lastPageRef.current !== pageKey) {
        trackMetaEvent("PageView");
        lastPageRef.current = pageKey;
      }
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
      if (anchor?.getAttribute("href")?.startsWith("/api/checkout/")) {
        trackMetaEvent("InitiateCheckout", { content_name: "Desbloqueia ENEM 2026" });
        window.gtag?.("event", "begin_checkout");
      }
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, [choice, ga, pageKey, pixel]);

  function choose(value: string) {
    localStorage.setItem("godev-consent", value);
    setChoice(value);
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
    }
  }

  if (!pixel && !ga) return null;
  return (
    <>
      {choice === null && (
        <aside className="consent" aria-label="Preferências de cookies">
          <b>Seu estudo, sua escolha.</b>
          <p>
            Usamos cookies essenciais para acesso. Você pode permitir métricas opcionais para melhorar a experiência.
          </p>
          <div>
            <button className="button secondary" onClick={() => choose("rejected")}>Só essenciais</button>
            <button className="button primary" onClick={() => choose("accepted")}>Permitir métricas</button>
          </div>
        </aside>
      )}
      <button className="consent-toggle" onClick={() => setChoice(null)}>Preferências de cookies</button>
    </>
  );
}
