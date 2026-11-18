import { NextResponse } from "next/server";
import { appUrl } from "../../../../lib/config";
import { sameOrigin, jsonError } from "../../../../lib/http";
import { sessionClient, serviceClient } from "../../../../lib/supabase";
import { createHash } from "node:crypto";
import { features } from "../../../../lib/features";
import { mysqlPool } from "../../../../lib/mysql";

/** Versão dos termos/privacidade apresentada no cadastro público (registrada junto da aceitação). */
const TERMS_VERSION = "2026-11";
const PUBLIC_MESSAGE = "Se este e-mail puder ser cadastrado, enviamos um link para confirmar e criar sua senha. Confira também a caixa de spam.";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  const db = await sessionClient();
  if (!db) return jsonError("O cadastro está temporariamente indisponível.", 503);
  const input = await req.json().catch(() => null);
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input?.password === "string" ? input.password : "";
  const name = typeof input?.name === "string" ? input.name.trim().slice(0, 120) : "";
  if (!emailPattern.test(email) || email.length > 254) return jsonError("Informe um e-mail válido.");
  const publicSignup = features.gratis;
  if (publicSignup && input?.acceptTerms !== true) return jsonError("Para criar a conta, aceite os termos e a política de privacidade.");
  if (password.length < 8) return jsonError("A senha precisa ter pelo menos 8 caracteres.");
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return jsonError("Use uma senha com letras e números.");

  try {
    const adminDb = serviceClient();
    const hash = createHash("sha256").update(email).digest("hex");
    const { data: allowed, error: rateError } = await adminDb.rpc("take_rate_limit", {
      p_key: `register:${hash}`,
      p_limit: 3,
      p_seconds: 900,
    });
    if (rateError || !allowed) return jsonError("Aguarde alguns minutos antes de tentar novamente.", 429);

    const [{ data: entitlement, error: entitlementError }, { data: invite, error: inviteError }] = await Promise.all([
      adminDb.from("entitlements").select("order_id").eq("email", email).eq("active", true).limit(1).maybeSingle(),
      adminDb.from("admin_invites").select("name").eq("email", email).eq("active", true).maybeSingle(),
    ]);
    if (entitlementError || inviteError) return jsonError("Não foi possível validar o acesso agora.", 503);
    if (!entitlement && !invite && !publicSignup) return jsonError("Não foi possível concluir o cadastro com os dados informados.", 403);

    const { data: listed } = await adminDb.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = listed?.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (existing) {
      // Cadastro público não revela se o e-mail já existe (evita enumeração de contas).
      if (publicSignup && !entitlement && !invite) return NextResponse.json({ message: PUBLIC_MESSAGE });
      return jsonError("Este e-mail já possui cadastro. Use a entrada ou a recuperação de senha.", 409);
    }

    const { data: signedUp, error: signUpError } = await db.auth.signUp({
      email,
      password,
      options: {
        data: { name: name || invite?.name || "Aluno" },
        emailRedirectTo: `${appUrl}/entrar`,
      },
    });
    if (signUpError || !signedUp.user) return jsonError("Não foi possível criar o cadastro.", 503);

    if (publicSignup) {
      try {
        await mysqlPool().query("UPDATE users SET signup_source = ?, terms_version = ?, terms_accepted_at = CURRENT_TIMESTAMP(3), marketing_optin = ? WHERE id = ?", ["email", TERMS_VERSION, input?.marketing === true, signedUp.user.id]);
      } catch { /* migração 06 ainda não aplicada: o cadastro segue, sem o registro de aceite */ }
    }
    if (signedUp.session) {
      const { data: profile } = await db.from("profiles").select("role").eq("id", signedUp.user.id).maybeSingle();
      return NextResponse.json({ redirect: `${appUrl}${profile?.role === "admin" ? "/admin" : "/aluno"}` });
    }
    if (publicSignup && !entitlement && !invite) return NextResponse.json({ message: PUBLIC_MESSAGE });
    return NextResponse.json({
      message: "Cadastro iniciado. Confirme seu e-mail para ativar o acesso e depois entre com sua senha.",
    });
  } catch {
    return jsonError("Serviço temporariamente indisponível.", 503);
  }
}
