/**
 * Planos, ofertas e direitos (puro, sem I/O). Valores sempre em centavos BRL.
 * Separa três conceitos: plano (Grátis/Essencial/Premium), oferta comercial versionada (preço + vigência) e direito ativo (origem).
 * Esta camada NÃO é ligada ainda às rotas existentes: `canAccess` continua valendo até a etapa de cadastro/direitos ser integrada.
 */
export type Tier = "gratis" | "essencial" | "premium";
export const tierRank: Record<Tier, number> = { gratis: 0, essencial: 1, premium: 2 };
export const tierLabel: Record<Tier, string> = { gratis: "Grátis", essencial: "Essencial", premium: "Premium" };

export type OfferStatus = "rascunho" | "ativa" | "encerrada";
export type Offer = {
  code: string;
  tier: Exclude<Tier, "gratis">;
  version: number;
  cents: number;
  currency: "BRL";
  status: OfferStatus;
  validFrom: string | null;
  validUntil: string | null;
};

export function validateOffer(offer: Offer): string[] {
  const problems: string[] = [];
  if (!/^[a-z0-9-]{3,40}$/.test(offer.code)) problems.push("código inválido");
  if (!Number.isInteger(offer.cents) || offer.cents <= 0) problems.push("valor deve ser inteiro positivo em centavos");
  if (offer.currency !== "BRL") problems.push("moeda deve ser BRL");
  if (!Number.isInteger(offer.version) || offer.version < 1) problems.push("versão inválida");
  if (offer.validFrom && offer.validUntil && offer.validFrom > offer.validUntil) problems.push("vigência invertida");
  return problems;
}

/** Oferta publicada e dentro da vigência (datas AAAA-MM-DD em America/Sao_Paulo). */
export function offerIsLive(offer: Offer, today: string): boolean {
  return offer.status === "ativa" && validateOffer(offer).length === 0 && (!offer.validFrom || offer.validFrom <= today) && (!offer.validUntil || today <= offer.validUntil);
}

/** Escolhe a oferta vigente de maior versão para o plano. Preço editado vale só para pedidos novos. */
export function currentOffer(offers: Offer[], tier: Offer["tier"], today: string): Offer | null {
  return offers.filter((o) => o.tier === tier && offerIsLive(o, today)).sort((a, b) => b.version - a.version)[0] ?? null;
}

export type Entitlement = { orderId: string; plan: string; active: boolean };
export type Rights = { tier: Tier; origin: string | null; sources: { orderId: string; plan: Tier }[] };

const known = (plan: string): plan is "essencial" | "premium" => plan === "essencial" || plan === "premium";

/**
 * Nível efetivo: maior entre os direitos ATIVOS; sem nenhum, Grátis (conta verificada). Administrador não "compra":
 * quem decide isso é o chamador. Plano desconhecido é ignorado (falha fechada). Reembolso/cancelamento de um pedido
 * remove só a sua linha (`active=false`) e os demais direitos continuam.
 */
export function rightsFor(entitlements: Entitlement[], verified: boolean): Rights | null {
  if (!verified) return null;
  const sources = entitlements.filter((e) => e.active && known(e.plan)).map((e) => ({ orderId: e.orderId, plan: e.plan as Tier }));
  if (!sources.length) return { tier: "gratis", origin: null, sources: [] };
  const best = sources.reduce((a, b) => (tierRank[b.plan] > tierRank[a.plan] ? b : a));
  return { tier: best.plan, origin: best.orderId, sources };
}

export const canUse = (tier: Tier, required: Tier) => tierRank[tier] >= tierRank[required];

/** Cotas e itens do Grátis: configuração inicial editável; o servidor sempre decide com base nela. */
export type FreeConfig = {
  trilhaUnits: string[];
  questionsPerDay: number;
  simuladosPerMonth: number;
  essayIncluded: boolean;
};
export const defaultFreeConfig: FreeConfig = { trilhaUnits: [], questionsPerDay: 10, simuladosPerMonth: 0, essayIncluded: false };

export type QuotaUse = { key: string; day: string };
/** Dia (AAAA-MM-DD) em America/Sao_Paulo. */
export const saoPauloDay = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

/**
 * Consome 1 unidade da cota diária por ação válida, sem contar a mesma ação duas vezes (`key` = ex.: id da questão no dia).
 * Devolve o novo uso e se a ação foi permitida. `limit` null = ilimitado.
 */
export function consumeDaily(uses: QuotaUse[], key: string, day: string, limit: number | null): { allowed: boolean; uses: QuotaUse[]; remaining: number | null } {
  const today = uses.filter((u) => u.day === day);
  if (today.some((u) => u.key === key)) return { allowed: true, uses, remaining: limit === null ? null : Math.max(0, limit - today.length) };
  if (limit !== null && today.length >= limit) return { allowed: false, uses, remaining: 0 };
  const next = [...uses, { key, day }];
  return { allowed: true, uses: next, remaining: limit === null ? null : limit - today.length - 1 };
}
