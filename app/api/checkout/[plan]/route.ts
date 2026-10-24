import { serviceClient } from "../../../../lib/supabase";
import { jsonError } from "../../../../lib/http";
import { NextResponse } from "next/server";
import { checkoutConfigured } from "../../../../lib/readiness";
import { caktoFallbackOffers } from "../../../../lib/config";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ plan: string }> },
) {
  if (!checkoutConfigured())
    return jsonError("Vendas ainda não disponíveis.", 503);
  const { plan } = await params;
  if (!["essencial", "premium"].includes(plan))
    return jsonError("Plano inválido", 404);
  try {
  const fallback = caktoFallbackOffers[plan as keyof typeof caktoFallbackOffers];
  if (!fallback) return jsonError("Plano inválido", 404);
  let offer: { checkout_url?: string; cakto_product_id?: string; cakto_offer_id?: string } | null = null;
  try {
    const db = serviceClient();
    const result = await db.from("offers").select("checkout_url,cakto_product_id,cakto_offer_id").eq("plan", plan).eq("enabled", true).single();
    offer = result.data;
  } catch {
    offer = null;
  }
  const checkoutUrl = offer?.checkout_url || fallback.checkoutUrl;
  const productId = offer?.cakto_product_id || fallback.productId;
  const offerId = offer?.cakto_offer_id || fallback.offerId;
  const url = new URL(checkoutUrl);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "pay.cakto.com.br" ||
    url.username ||
    url.password
  )
    return jsonError("Checkout inválido", 503);
  const response = NextResponse.redirect(url, 303);
  response.headers.set("X-Checkout-Plan", plan);
  response.headers.set("X-Cakto-Product", productId);
  response.headers.set("X-Cakto-Offer", offerId);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
  } catch {
    return jsonError("Pagamento temporariamente indisponível. Tente novamente mais tarde.", 503);
  }
}

