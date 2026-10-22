import { serviceClient } from "../../../../lib/supabase";
import { jsonError } from "../../../../lib/http";
import { NextResponse } from "next/server";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ plan: string }> },
) {
  if (
    process.env.CHECKOUT_ENABLED !== "true" ||
    process.env.CAKTO_WEBHOOK_ENABLED !== "true" ||
    !process.env.CAKTO_WEBHOOK_SECRET ||
    !process.env.RESEND_API_KEY ||
    !process.env.EMAIL_FROM ||
    !process.env.CRON_SECRET
  )
    return jsonError("Vendas ainda não disponíveis.", 503);
  const { plan } = await params;
  if (!["essencial", "premium"].includes(plan))
    return jsonError("Plano inválido", 404);
  const db = serviceClient();
  const { data: offer } = await db
    .from("offers")
    .select("*")
    .eq("plan", plan)
    .eq("enabled", true)
    .single();
  const { data: support } = await db
    .from("support_settings")
    .select("email,legal_name")
    .eq("id", true)
    .single();
  if (
    !offer?.checkout_url ||
    !offer.cakto_product_id ||
    !offer.cakto_offer_id ||
    !support?.email ||
    !support.legal_name
  )
    return jsonError("Plano ainda não disponível.", 503);
  const url = new URL(offer.checkout_url);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "pay.cakto.com.br" ||
    url.username ||
    url.password
  )
    return jsonError("Checkout inválido", 503);
  return NextResponse.redirect(url, 303);
}
