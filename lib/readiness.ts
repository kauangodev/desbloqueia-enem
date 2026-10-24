// Enable only after custom SMTP and purchase-to-access delivery are validated.
export function checkoutConfigured(env: Record<string, string | undefined> = process.env) {
  return env.CHECKOUT_ENABLED === "true"
    && env.AUTH_EMAIL_READY === "true"
    && env.CAKTO_WEBHOOK_ENABLED === "true"
    && Boolean(env.CAKTO_WEBHOOK_SECRET)
    && Boolean(env.NEXT_PUBLIC_SUPABASE_URL)
    && Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    && Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
}
