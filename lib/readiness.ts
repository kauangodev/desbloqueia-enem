// Checkout uses the Cakto receipt and the site's direct password registration.
// SMTP is optional for the purchase path and must not block a paid checkout.
export function checkoutConfigured(env: Record<string, string | undefined> = process.env) {
  const mysqlReady = Boolean(env.HOSTINGER_MYSQL_HOST && env.HOSTINGER_MYSQL_DATABASE && env.HOSTINGER_MYSQL_USER && env.HOSTINGER_MYSQL_PASSWORD);
  const legacySupabaseReady = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_ROLE_KEY);
  return env.CHECKOUT_ENABLED === "true"
    && env.CAKTO_WEBHOOK_ENABLED === "true"
    && Boolean(env.CAKTO_WEBHOOK_SECRET)
    && (mysqlReady || legacySupabaseReady);
}

