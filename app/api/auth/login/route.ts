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
    const hash = createHash("sha256")
      .update(email.trim().toLowerCase())
      .digest("hex");
    const { data: allowed, error: limitError } = await serviceClient().rpc(
      "take_rate_limit",
      { p_key: `login:${hash}`, p_limit: 3, p_seconds: 900 },
    );
    if (limitError || !allowed)
      return jsonError(
        "Aguarde alguns minutos antes de tentar novamente.",
        429,
      );
    const { error } = await db.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    });
    if (error && error.status && error.status >= 500)
      return jsonError("Não foi possível enviar agora. Tente novamente.", 503);
    return NextResponse.json({
      message:
        "Se este e-mail tem uma conta, você receberá um link de acesso. Confira também o spam.",
    });
  } catch {
    return jsonError("Serviço temporariamente indisponível.", 503);
  }
}
