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
  const { email } = await req.json().catch(() => ({}));
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
    const [{ data: entitlement }, { data: invite }] = await Promise.all([
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
    if (error && error.status && error.status >= 500)
      return jsonError("Não foi possível enviar agora. Tente novamente.", 503);
    return NextResponse.json({
      message:
        "Se este e-mail tem uma compra aprovada ou convite, você receberá um link de acesso. Confira também o spam.",
    });
  } catch {
    return jsonError("Serviço temporariamente indisponível.", 503);
  }
}
