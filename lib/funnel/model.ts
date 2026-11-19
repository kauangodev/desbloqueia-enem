/**
 * Eventos de negócio do funil (nomes, quem os emite e como se calculam as taxas). Puro e testável.
 *
 * Origem de cada evento (a venda é o pagamento CONFIRMADO; os anteriores são indicadores de caminho):
 *  - Navegador, só com consentimento de métricas: landing_viewed (denominador: visita elegível = visitante que consentiu),
 *    demo_started, demo_answered, plans_viewed, signup_started.
 *  - Servidor (fonte de verdade, sem consentimento porque é dado operacional da conta): signup_verified, first_study_completed,
 *    checkout_started (pedido criado), purchase_confirmed (pagamento conferido pelo operador).
 * Abrir o QR e "Já fiz o Pix" são estados do pedido e NÃO contam como compra.
 */
export const CLIENT_EVENTS = ["landing_viewed", "demo_started", "demo_answered", "plans_viewed", "signup_started"] as const;
export const SERVER_EVENTS = ["signup_verified", "first_study_completed", "checkout_started", "purchase_confirmed"] as const;
export const ALL_EVENTS = [...CLIENT_EVENTS, ...SERVER_EVENTS] as const;
export type ClientEvent = (typeof CLIENT_EVENTS)[number];
export type ServerEvent = (typeof SERVER_EVENTS)[number];
export type FunnelEvent = (typeof ALL_EVENTS)[number];

export const isClientEvent = (name: unknown): name is ClientEvent => typeof name === "string" && (CLIENT_EVENTS as readonly string[]).includes(name);

/** Parâmetros aceitos (lista fechada, valores curtos). Nada de e-mail, resposta de estudo, QR, código Pix ou identificador privado. */
const CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export type EventParams = Partial<Record<(typeof CAMPAIGN_KEYS)[number] | "plan" | "device" | "visitor", string>> & { correct?: boolean };

export function sanitizeParams(input: unknown): EventParams {
  const out: EventParams = {};
  if (!input || typeof input !== "object") return out;
  const raw = input as Record<string, unknown>;
  for (const key of CAMPAIGN_KEYS) { const v = raw[key]; if (typeof v === "string" && /^[\w .:+-]{1,80}$/.test(v)) out[key] = v; }
  if (raw.plan === "gratis" || raw.plan === "essencial" || raw.plan === "premium") out.plan = raw.plan;
  if (raw.device === "mobile" || raw.device === "tablet" || raw.device === "desktop") out.device = raw.device;
  if (typeof raw.correct === "boolean") out.correct = raw.correct;
  if (typeof raw.visitor === "string" && /^[0-9a-f-]{36}$/.test(raw.visitor)) out.visitor = raw.visitor;
  return out;
}

export const deviceOf = (width: number): "mobile" | "tablet" | "desktop" => (width < 768 ? "mobile" : width < 1100 ? "tablet" : "desktop");

/** Taxa com denominador explícito. Sem denominador = "sem dados" (null), nunca 0%. */
export function rate(numerator: number, denominator: number): { numerator: number; denominator: number; pct: number | null; incomplete: boolean } {
  // Numerador maior que o denominador significa base incompleta (ex.: cadastros de quem não consentiu ou não passou pela landing): não mostra percentual enganoso.
  const incomplete = denominator > 0 && numerator > denominator;
  return { numerator, denominator, pct: denominator > 0 && !incomplete ? Math.round((numerator / denominator) * 1000) / 10 : null, incomplete };
}

export type FunnelCounts = Partial<Record<FunnelEvent, number>>;
/** Os cinco comparativos pedidos: cada um com unidade própria (visitantes, contas ou pedidos). */
export function funnelRates(c: { visitors: number; demoVisitors: number; planViewers: number; signupsVerified: number; firstStudy: number; checkouts: number; purchases: number }) {
  return {
    visitaParaDemo: rate(c.demoVisitors, c.visitors),
    visitaParaCadastroVerificado: rate(c.signupsVerified, c.visitors),
    cadastroParaPrimeiroEstudo: rate(c.firstStudy, c.signupsVerified),
    checkoutParaPagamento: rate(c.purchases, c.checkouts),
    visitaParaPagamento: rate(c.purchases, c.visitors),
  };
}