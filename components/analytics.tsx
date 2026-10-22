"use client";
import { useEffect, useState } from "react";
declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & {
      queue?: unknown[][];
      loaded?: boolean;
      version?: string;
      push?: unknown;
      callMethod?: (...args: unknown[]) => void;
    };
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
export default function Analytics() {
  const [choice, C] = useState<string | null>("loading");
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  useEffect(() => {
    C(localStorage.getItem("godev-consent"));
  }, []);
  useEffect(() => {
    if (choice !== "accepted") return;
    if (pixel && /^\d+$/.test(pixel) && !window.fbq) {
      const f = (...args: unknown[]) => {
        if (f.callMethod) f.callMethod(...args);
        else f.queue.push(args);
      };
      f.queue = [] as unknown[][];
      f.callMethod = undefined as undefined | ((...args: unknown[]) => void);
      window.fbq = f;
      window.fbq.loaded = true;
      window.fbq.version = "2.0";
      const s = document.createElement("script");
      s.src = "https://connect.facebook.net/en_US/fbevents.js";
      s.async = true;
      s.dataset.analytics = "true";
      document.head.appendChild(s);
      window.fbq("init", pixel);
      window.fbq("track", "ViewContent", {
        content_name: "Desbloqueia ENEM 2026",
      });
    }
    if (ga && /^G-[A-Z0-9]+$/.test(ga) && !window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = (...args) => window.dataLayer?.push(args);
      window.gtag("js", new Date());
      window.gtag("config", ga, { anonymize_ip: true });
      const s = document.createElement("script");
      s.src = `https://www.googletagmanager.com/gtag/js?id=${ga}`;
      s.async = true;
      s.dataset.analytics = "true";
      document.head.appendChild(s);
    }
    const url = new URL(location.href);
    const utm: Record<string, string> = {};
    for (const key of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ]) {
      const v = url.searchParams.get(key);
      if (v) utm[key] = v.slice(0, 120);
    }
    if (Object.keys(utm).length)
      sessionStorage.setItem("godev-utm", JSON.stringify(utm));
    const click = (e: MouseEvent) => {
      const a = (e.target as Element).closest("a");
      if (a?.getAttribute("href")?.startsWith("/api/checkout/")) {
        window.fbq?.("track", "InitiateCheckout", {
          content_name: "Desbloqueia ENEM 2026",
        });
        window.gtag?.("event", "begin_checkout");
      }
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, [choice, pixel, ga]);
  function choose(value: string) {
    localStorage.setItem("godev-consent", value);
    C(value);
    if (value === "rejected") {
      sessionStorage.removeItem("godev-utm");
      window.fbq?.("consent", "revoke");
      window.gtag?.("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
      });
      document
        .querySelectorAll("script[data-analytics]")
        .forEach((s) => s.remove());
    }
  }
  if (!pixel && !ga) return null;
  return (
    <>
      {choice === null && (
        <aside className="consent" aria-label="Preferências de cookies">
          <b>Seu estudo, sua escolha.</b>
          <p>
            Usamos cookies essenciais para acesso. Você pode permitir métricas
            opcionais para melhorar a experiência.
          </p>
          <div>
            <button
              className="button secondary"
              onClick={() => choose("rejected")}
            >
              Só essenciais
            </button>
            <button
              className="button primary"
              onClick={() => choose("accepted")}
            >
              Permitir métricas
            </button>
          </div>
        </aside>
      )}
      <button className="consent-toggle" onClick={() => C(null)}>
        Preferências de cookies
      </button>
    </>
  );
}
