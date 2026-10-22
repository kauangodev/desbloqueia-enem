import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
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
export const orderSchema = z.object({
  id: z.string().min(1).max(120),
  status: z.string(),
  customer: z.object({ email: z.email().max(254), name: z.string().max(160) }),
  product: z.object({ id: z.string().min(1) }),
  offer: z.object({ id: z.string().min(1) }),
  amount: z.number().nonnegative(),
  currency: z.literal("BRL"),
});
export const eventSchema = z.object({
  event: z.enum([
    "purchase_approved",
    "purchase_refused",
    "refund",
    "chargeback",
    "pix_gerado",
    "boleto_gerado",
    "picpay_gerado",
  ]),
  data: z.union([orderSchema, z.array(orderSchema).min(1).max(20)]),
});
export function nextStatus(current: string | null, event: string) {
  if (current === "refunded" || current === "chargedback") return current;
  if (event === "refund") return "refunded";
  if (event === "chargeback") return "chargedback";
  if (current === "paid" || event === "purchase_approved") return "paid";
  return event === "purchase_refused" ? "refused" : "pending";
}
