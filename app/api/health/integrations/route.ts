import { NextResponse } from "next/server";
import { checkoutConfigured } from "../../../../lib/readiness";
import { serviceClient } from "../../../../lib/supabase";

const officialOffers = {
  essencial: { product: "6ff97951-a03a-4bed-bbe5-62c88031c0fc", offer: "3biievb" },
  premium: { product: "e1fc994d-6000-41d4-9b08-5af47ec3ce07", offer: "3fq7t2s" },
} as const;

/** Internal, read-only smoke check. It never creates an order or entitlement. */
export async function GET(request: Request) {
  const expected = process.env.INTEGRATION_HEALTH_SECRET;
  const supplied = request.headers.get("x-integration-health-secret");
  if (!expected || supplied !== expected) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!serviceClient() || !checkoutConfigured()) return NextResponse.json({ ok: false, checkout: checkoutConfigured(), supabase: false }, { status: 503 });
  const db = serviceClient();
  if (!db) return NextResponse.json({ ok: false, checkout: false, supabase: false }, { status: 503 });
  const { data: offers, error: offersError } = await db.from("offers").select("plan,cakto_product_id,cakto_offer_id,enabled");
  const requiredTables = ["profiles", "offers", "orders", "payment_events", "entitlements", "email_deliveries", "essay_submissions", "support_tickets"];
  const tableChecks = await Promise.all(requiredTables.map(async (table) => {
    const { error } = await db.from(table).select("id", { count: "exact", head: true });
    return [table, !error] as const;
  }));
  const tables = Object.fromEntries(tableChecks);
  const offerStatus = Object.fromEntries(Object.entries(officialOffers).map(([plan, expectedOffer]) => {
    const actual = offers?.find((item) => item.plan === plan);
    return [plan, Boolean(actual && actual.enabled && actual.cakto_product_id === expectedOffer.product && actual.cakto_offer_id === expectedOffer.offer)];
  }));
  const { error: rpcError } = await db.rpc("receive_payment", { p_event: "healthcheck", p_data: {} });
  const rpcAvailable = Boolean(rpcError && /unsupported event/i.test(rpcError.message)) || !rpcError;
  const supabase = !offersError && rpcAvailable && Object.values(offerStatus).every(Boolean) && Object.values(tables).every(Boolean);
  return NextResponse.json({ ok: supabase && checkoutConfigured(), checkout: checkoutConfigured(), supabase, receivePaymentFunction: rpcAvailable, offers: offerStatus, webhook: process.env.CAKTO_WEBHOOK_ENABLED === "true" && Boolean(process.env.CAKTO_WEBHOOK_SECRET) }, { status: supabase && checkoutConfigured() ? 200 : 503, headers: { "cache-control": "no-store" } });
}
