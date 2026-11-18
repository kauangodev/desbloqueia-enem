"use client";
import { readConsent } from "../consent";
import { deviceOf, type ClientEvent } from "./model";

/**
 * Evento de negócio no navegador. Só envia com consentimento de métricas (sem consentimento: nada é gravado, nada é enviado).
 * Uma vez por carregamento de página para `once`. Vai ao coletor próprio (/api/events) e, se carregado, ao GA; nunca leva
 * e-mail, resposta de estudo ou dados de pagamento. O id do visitante é aleatório e só existe depois do consentimento.
 */
const sent = new Set<string>();
const VISITOR_KEY = "godev-visitor";

function visitorId(): string | undefined {
  try {
    let id = window.localStorage.getItem(VISITOR_KEY);
    if (!id || !/^[0-9a-f-]{36}$/.test(id)) { id = crypto.randomUUID(); window.localStorage.setItem(VISITOR_KEY, id); }
    return id;
  } catch { return undefined; }
}

function campaign(): Record<string, string> {
  // A URL atual vale mais que a sessão: o primeiro evento (visita) dispara antes de o coletor de campanhas guardar os parâmetros.
  let stored: Record<string, string> = {};
  try { stored = JSON.parse(window.sessionStorage.getItem("godev-utm") || "{}"); } catch { /* sem sessão */ }
  const fromUrl: Record<string, string> = {};
  try { const search = new URLSearchParams(window.location.search); for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) { const v = search.get(key); if (v) fromUrl[key] = v.slice(0, 80); } } catch { /* sem URL */ }
  return { ...stored, ...fromUrl };
}

export function trackBusiness(name: ClientEvent, extra: { plan?: string; correct?: boolean } = {}, options: { once?: boolean } = {}) {
  if (typeof window === "undefined" || readConsent()?.analytics !== true) return false;
  const key = `${name}:${extra.plan ?? ""}`;
  if (options.once && sent.has(key)) return false;
  sent.add(key);
  const params = { ...campaign(), ...extra, device: deviceOf(window.innerWidth), visitor: visitorId() };
  try {
    // fetch com keepalive: a mesma entrega do sendBeacon, mas visível ao navegador (DevTools) e testável.
    void fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, params }), keepalive: true }).catch(() => undefined);
  } catch { /* medição nunca atrapalha o estudo */ }
  window.gtag?.("event", name, { plan: extra.plan, correct: extra.correct });
  return true;
}