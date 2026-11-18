import { features } from "./features";

/** Destino do botão de compra. Com o corte (`pix`), vai ao checkout da GoDev; sem ele, ao fluxo Cakto existente. */
export const checkoutHref = (plan: string, pix: boolean = features.pix) => (pix ? `/aluno/checkout/${plan}` : `/api/checkout/${plan}`);

const CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "src", "sck"];

/** Link antigo de início de checkout (`/api/checkout/<plano>?utm…`) → checkout GoDev, mantendo SÓ parâmetros de campanha conhecidos. */
export function legacyCheckoutTarget(plan: string, search: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const key of CAMPAIGN_KEYS) { const value = search.get(key); if (value && value.length <= 200) params.set(key, value); }
  const query = params.toString();
  return `/aluno/checkout/${plan}${query ? `?${query}` : ""}`;
}
