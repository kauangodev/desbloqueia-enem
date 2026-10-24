import { sessionClient, serviceClient } from "../../../../lib/supabase";
import { appUrl } from "../../../../lib/config";
import { sameOrigin, jsonError } from "../../../../lib/http";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  const db = await sessionClient();
  if (!db)
    return jsonError(
      "O acesso por e-mail ainda não está disponível. Tente novamente mais tarde.",
      503,
    );
  const input = await req.json().catch(() => null);
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : null;
  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  )
    return jsonError("Informe um e-mail válido.");
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const adminDb = serviceClient();
    const hash = createHash("sha256").update(normalizedEmail).digest("hex");
    const { data: allowed, error: limitError } = await adminDb.rpc(
      "take_rate_limit",
      { p_key: `login:${hash}`, p_limit: 3, p_seconds: 900 },
    );
    if (limitError || !allowed)
      return jsonError(
        "Aguarde alguns minutos antes de tentar novamente.",
        429,
      );
    const [{ data: entitlement, error: entitlementError }, { data: invite, error: inviteError }] = await Promise.all([
      adminDb
        .from("entitlements")
        .select("order_id")
        .eq("email", normalizedEmail)
        .eq("active", true)
        .limit(1)
        .maybeSingle(),
      adminDb
        .from("admin_invites")
        .select("name")
        .eq("email", normalizedEmail)
        .eq("active", true)
        .maybeSingle(),
    ]);
    if (entitlementError || inviteError)
      return jsonError("Não foi possível verificar o acesso. Tente novamente mais tarde.", 503);
    if (!entitlement && !invite)
      return NextResponse.json({
        message:
          "Se este e-mail tem uma compra aprovada ou convite, você receberá um link de acesso. Confira também o spam.",
      });
    const { error } = await db.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${appUrl}/auth/callback`,
        data: invite?.name ? { name: invite.name } : undefined,
      },
    });
    if (error) {
      console.error("auth_email_failed", { code: error.code, status: error.status });
      return jsonError(
        error.status === 429
          ? "Limite de envios atingido. Aguarde alguns minutos e tente novamente."
          : "O envio do link está indisponível. Nenhum link foi enviado. Tente novamente mais tarde ou fale com o atendimento.",
        error.status === 429 ? 429 : 503,
      );
    }
    return NextResponse.json({
      message:
        "Se este e-mail tem uma compra aprovada ou convite, você receberá um link de acesso. Confira também o spam.",
    });
  } catch {
    return jsonError("Serviço temporariamente indisponível.", 503);
  }
}
