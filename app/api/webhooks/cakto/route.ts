import { NextResponse } from "next/server";
import {
  eventSchema,
  verifySignature,
  verifyWebhookSecret,
  configuredCaktoOffer,
} from "../../../../lib/payment";
import { serviceClient } from "../../../../lib/supabase";
import { jsonError } from "../../../../lib/http";
export async function POST(req: Request) {
  if (
    !process.env.CAKTO_WEBHOOK_SECRET ||
    process.env.CAKTO_WEBHOOK_ENABLED !== "true"
  )
    return jsonError("Integração indisponível", 503);
  if (Number(req.headers.get("content-length") || 0) > 131072)
    return jsonError("Corpo muito grande", 413);
  const raw = await req.text();
  if (Buffer.byteLength(raw) > 131072)
    return jsonError("Corpo muito grande", 413);
  let untrustedPayload: unknown;
  try {
    untrustedPayload = JSON.parse(raw);
  } catch {
    return jsonError("Evento inválido", 422);
  }
  const bodySecret =
    typeof untrustedPayload === "object" && untrustedPayload !== null
      ? (untrustedPayload as { secret?: unknown }).secret
      : undefined;
  const signatureValid = verifySignature(
    raw,
    req.headers.get("x-cakto-timestamp"),
    req.headers.get("x-cakto-signature"),
    process.env.CAKTO_WEBHOOK_SECRET,
  );
  if (
    !signatureValid &&
    !verifyWebhookSecret(bodySecret, process.env.CAKTO_WEBHOOK_SECRET)
  )
    return jsonError("Assinatura inválida", 401);
  let payload;
  try {
    payload = eventSchema.parse(untrustedPayload);
  } catch {
    return jsonError("Evento inválido", 422);
  }
  try {
    const db = serviceClient();
    const items = Array.isArray(payload.data) ? payload.data : [payload.data];
    for (const order of items) {
      if (["purchase_approved", "subscription_created", "subscription_renewed", "subscription_resumed", "subscription_late_recovered"].includes(payload.event) && order.status !== "paid")
        return jsonError("Estado incompatível", 422);
      const fallback = configuredCaktoOffer(order.product.id, order.offer.id);
      if (!fallback) return jsonError("Produto ou oferta Cakto não configurado", 422);
      const { error } = await db.rpc("receive_payment", {
        p_event: payload.event,
        p_data: order,
      });
      if (error)
        return jsonError(
          "Evento não persistido; reenvie pelo painel Cakto",
          503,
        );
    }
    return NextResponse.json({ received: true });
  } catch {
    return jsonError("Banco indisponível; reenvie pelo painel Cakto", 503);
  }
}



