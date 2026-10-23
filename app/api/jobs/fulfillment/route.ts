import { serviceClient } from "../../../../lib/supabase";
import { welcomeEmail } from "../../../../lib/email";
import { appUrl } from "../../../../lib/config";
import { jsonError } from "../../../../lib/http";
import { NextResponse } from "next/server";
export async function GET(req: Request) {
  if (
    !process.env.CRON_SECRET ||
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return jsonError("Não autorizado", 401);
  const db = serviceClient();
  const { data: jobs, error } = await db.rpc("claim_emails");
  if (error) return jsonError("Fila indisponível", 503);
  let accepted = 0;
  for (const job of jobs || []) {
    try {
      const { data: order } = await db
        .from("orders")
        .select("status,name")
        .eq("id", job.order_id)
        .single();
      if (order?.status !== "paid") {
        await db
          .from("email_deliveries")
          .update({ status: "canceled", leased_until: null })
          .eq("id", job.id);
        continue;
      }
      const { data: existing } = await db
        .from("profiles")
        .select("id")
        .eq("email", job.email)
        .maybeSingle();
      let userId = existing?.id;
      if (!userId) {
        const result = await db.auth.admin.createUser({
          email: job.email,
          email_confirm: true,
          user_metadata: { name: order.name },
        });
        if (result.error) {
          const { data: raced } = await db
            .from("profiles")
            .select("id")
            .eq("email", job.email)
            .maybeSingle();
          if (!raced) throw new Error("account_provision_failed");
          userId = raced.id;
        } else userId = result.data.user.id;
      }
      const { error: linkError } = await db
        .from("entitlements")
        .update({ user_id: userId })
        .eq("email", job.email);
      if (linkError) throw new Error("entitlement_link_failed");
      if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
        await db
          .from("email_deliveries")
          .update({
            status: "access_ready",
            leased_until: null,
            last_error: null,
          })
          .eq("id", job.id);
        accepted++;
        continue;
      }
      const sent = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `access-${job.id}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM,
          to: job.email,
          subject: "Seu acesso ao Desbloqueia ENEM | GoDev Education",
          html: welcomeEmail(appUrl),
        }),
      });
      if (!sent.ok) throw new Error(`email_provider_${sent.status}`);
      const receipt = await sent.json();
      const { error: saveError } = await db
        .from("email_deliveries")
        .update({
          status: "accepted",
          provider_id: receipt.id,
          leased_until: null,
          last_error: null,
        })
        .eq("id", job.id);
      if (saveError) throw new Error("receipt_save_failed");
      accepted++;
    } catch (err) {
      await db
        .from("email_deliveries")
        .update({
          status: "failed",
          last_error:
            err instanceof Error
              ? err.message.slice(0, 100)
              : "delivery_failed",
          leased_until: null,
          next_attempt: new Date(
            Date.now() + Math.min(3600, 60 * 2 ** job.attempts) * 1000,
          ).toISOString(),
        })
        .eq("id", job.id);
    }
  }
  return NextResponse.json({ processed: jobs?.length || 0, accepted });
}
