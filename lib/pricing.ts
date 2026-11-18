import { plans } from "./config";
import { features } from "./features";

/** Taxa de serviço somada pelo checkout da Cakto (R$ 0,99). O checkout Pix da GoDev não cobra taxa adicional. */
export const caktoFeeCents = (pix: boolean) => (pix ? 0 : 99);
export const SERVICE_FEE_CENTS = caktoFeeCents(features.pix);

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
