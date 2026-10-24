// Checkout uses the Cakto receipt and the site's direct password registration.
// SMTP is optional for the purchase path and must not block a paid checkout.
export function checkoutConfigured(env: Record<string, string | undefined> = process.env) {
  return env.CHECKOUT_ENABLED === "true"
    && env.CAKTO_WEBHOOK_ENABLED === "true"
    && Boolean(env.CAKTO_WEBHOOK_SECRET)
    && Boolean(env.NEXT_PUBLIC_SUPABASE_URL)
    && Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    && Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
}

