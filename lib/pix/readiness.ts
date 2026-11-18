import "server-only";
import { cache } from "react";
import { features } from "../features";
import { activeOffer } from "./store";

export type PixReadiness = { essencial: boolean; premium: boolean; cents: { essencial: number | null; premium: number | null } };

/** Quais planos têm oferta Pix ATIVA e válida (e o preço dela). Falha de leitura = nada à venda (nunca vende sem conferir). */
export const pixReadiness = cache(async function pixReadiness(): Promise<PixReadiness> {
  const empty: PixReadiness = { essencial: false, premium: false, cents: { essencial: null, premium: null } };
  if (!features.pix) return empty;
  try {
    const [e, p] = await Promise.all([activeOffer("essencial"), activeOffer("premium")]);
    return { essencial: Boolean(e), premium: Boolean(p), cents: { essencial: e?.cents ?? null, premium: p?.cents ?? null } };
  } catch { return empty; }
});
