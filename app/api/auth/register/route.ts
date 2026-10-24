import { NextResponse } from "next/server";
import { appUrl } from "../../../../lib/config";
import { sameOrigin, jsonError } from "../../../../lib/http";
import { sessionClient, serviceClient } from "../../../../lib/supabase";
import { createHash } from "node:crypto";

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
    if (!entitlement && !invite) {
      return jsonError("O cadastro é liberado após a confirmação da compra ou de um convite administrativo.", 403);
    }

    const { data: listed } = await adminDb.auth.admin.listUsers({ page: 1, perPage: 1000 });
    let user = listed?.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) {
      const updated = await adminDb.auth.admin.updateUserById(user.id, {
        password,
        email_confirm: true,
        user_metadata: { ...user.user_metadata, ...(name ? { name } : {}) },
      });
      if (updated.error) return jsonError("Não foi possível atualizar o cadastro.", 503);
      user = updated.data.user;
    } else {
      const created = await adminDb.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: name || invite?.name || "Aluno" },
      });
      if (created.error || !created.data.user) return jsonError("Não foi possível criar o cadastro.", 503);
      user = created.data.user;
    }

    const { data: signedIn, error: signInError } = await db.auth.signInWithPassword({ email, password });
    if (signInError || !signedIn.user) {
      return NextResponse.json({ message: "Cadastro criado. Entre novamente com sua nova senha." });
    }
    const { data: profile } = await db.from("profiles").select("role").eq("id", signedIn.user.id).maybeSingle();
    return NextResponse.json({ redirect: `${appUrl}${profile?.role === "admin" ? "/admin" : "/aluno"}` });
  } catch {
    return jsonError("Serviço temporariamente indisponível.", 503);
  }
}

