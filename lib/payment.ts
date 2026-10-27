import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { caktoFallbackOffers } from "./config";

export function configuredCaktoOffer(productId: unknown, offerId: unknown) {
  return Object.entries(caktoFallbackOffers).find(([, offer]) => offer.productId === productId && offer.offerId === offerId) || null;
}

export function nextMysqlOrderStatus(current: string | null | undefined, event: string, incoming: string | null | undefined) {
  if (current === "refunded" || current === "chargedback") return current;
  if (event === "refund") return "refunded";
  if (event === "chargeback") return "chargedback";
  if (current === "paid" || incoming === "paid" || event === "purchase_approved" || ["subscription_created", "subscription_renewed", "subscription_resumed", "subscription_late_recovered"].includes(event)) return "paid";
  if (event === "purchase_refused" || incoming === "refused") return "refused";
  return "pending";
}
export function verifySignature(
  raw: string,
  timestamp: string | null,
  signature: string | null,
  secret: string,
  now = Date.now(),
) {
  if (
    !timestamp ||
    !/^\d+$/.test(timestamp) ||
    !signature ||
    !secret ||
    Math.abs(now / 1000 - Number(timestamp)) > 300
  )
    return false;
  const expected = Buffer.from(
    "v1=" +
      createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex"),
  );
  return signature.split(",").some((s) => {
    const actual = Buffer.from(s.trim());
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  });
}

export function verifyWebhookSecret(received: unknown, secret: string) {
  if (typeof received !== "string" || !received || !secret) return false;
  const actual = Buffer.from(received);
  const expected = Buffer.from(secret);
  return (
    actual.length === expected.length && timingSafeEqual(actual, expected)
  );
}
export const orderSchema = z.object({
  id: z.string().min(1).max(120),
  status: z.string(),
  customer: z.object({ email: z.email().max(254), name: z.string().max(160) }),
  product: z.object({ id: z.string().min(1) }),
  offer: z.object({ id: z.string().min(1) }),
  baseAmount: z.number().nonnegative().optional(),
  amount: z.number().nonnegative().nullable(),
  currency: z.literal("BRL"),
});
export const eventSchema = z.object({
  event: z.enum([
    "purchase_approved",
    "purchase_refused",
    "refund",
    "refund_requested",
    "chargeback",
    "dispute_defense_requested",
    "purchase_email_failed",
    "pix_gerado",
    "boleto_gerado",
    "picpay_gerado",
    "openfinance_nubank_gerado",
    "subscription_created",
    "subscription_renewed",
    "subscription_renewal_refused",
    "subscription_paused",
    "subscription_resumed",
    "subscription_late",
    "subscription_late_recovered",
    "subscription_canceled",
  ]),
  data: z.union([orderSchema, z.array(orderSchema).min(1).max(20)]),
});
export function nextStatus(current: string | null, event: string) {
  if (current === "refunded" || current === "chargedback") return current;
  if (event === "refund") return "refunded";
  if (event === "chargeback") return "chargedback";
  if (["subscription_canceled", "subscription_paused", "subscription_late", "subscription_renewal_refused"].includes(event)) return event.replace("subscription_", "");
  if (["subscription_created", "subscription_renewed", "subscription_resumed", "subscription_late_recovered"].includes(event)) return "paid";
  if (current === "paid" || event === "purchase_approved") return "paid";
  return event === "purchase_refused" ? "refused" : "pending";
}

