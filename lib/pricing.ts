import { plans } from "./config";

/** Taxa de serviço somada pelo checkout da Cakto a cada compra (confirmada nas duas páginas de pagamento: R$ 0,99). */
export const SERVICE_FEE_CENTS = 99;

export type PlanId = "essencial" | "premium";

/** Valor-base do plano. */
export function planBaseCents(id: PlanId) {
  return plans.find((plan) => plan.id === id)?.cents ?? 0;
}

/** Total efetivamente cobrado no checkout: valor-base + taxa de serviço. */
export function planTotalCents(id: PlanId) {
  return planBaseCents(id) + SERVICE_FEE_CENTS;
}

export const brl = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
