import { NextResponse } from "next/server";
import { appUrl } from "../../../../lib/config";
import { sameOrigin, jsonError } from "../../../../lib/http";
import { publicClient, serviceClient } from "../../../../lib/supabase";
import { createHash, randomBytes } from "node:crypto";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  const input = await req.json().catch(() => null);
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    return jsonError("Informe um e-mail válido.");
  const adminDb = serviceClient();
  const key = createHash("sha256").update(email).digest("hex");
  const { data: allowed } = await adminDb.rpc("take_rate_limit", { p_key: `password:${key}`, p_limit: 3, p_seconds: 900 });
  if (!allowed) return jsonError("Aguarde alguns minutos antes de tentar novamente.", 429);
  let [{ data: entitlement, error: entitlementError }, { data: invite, error: inviteError }, { data: admin, error: adminError }] = await Promise.all([
    adminDb.from("entitlements").select("user_id").eq("email", email).eq("active", true).limit(1).maybeSingle(),
    adminDb.from("admin_invites").select("name").eq("email", email).eq("active", true).maybeSingle(),
    adminDb.from("profiles").select("name,role").eq("email", email).eq("role", "admin").maybeSingle(),
  ]);
  if (entitlementError || inviteError || adminError) {
    console.error("auth_access_lookup_failed", {
      entitlement: (entitlementError as { code?: string; errno?: number } | null)?.code || (entitlementError as { errno?: number } | null)?.errno || null,
      invite: (inviteError as { code?: string; errno?: number } | null)?.code || (inviteError as { errno?: number } | null)?.errno || null,
      admin: (adminError as { code?: string; errno?: number } | null)?.code || (adminError as { errno?: number } | null)?.errno || null,
    });
    return jsonError("Não foi possível verificar o acesso agora.", 503);
  }
  const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  let bootstrapped = false;
  if (process.env.ADMIN_BOOTSTRAP_ENABLED === "true" && bootstrapEmail === email && !entitlement) {
    try {
      const { error: promotedError } = await adminDb.from("users").upsert({ id: randomBytes(16).toString("hex"), email, name: "Kauan", role: "admin", email_verified_at: new Date() }, { onConflict: "email" });
      const { error: inviteError } = await adminDb.from("admin_invites").upsert({ email, name: "Kauan", active: true }, { onConflict: "email" });
      if (promotedError || inviteError) {
        console.error("admin_bootstrap_write_failed", { promoted: (promotedError as { code?: string; errno?: number } | null)?.code || (promotedError as { errno?: number } | null)?.errno || null, invite: (inviteError as { code?: string; errno?: number } | null)?.code || (inviteError as { errno?: number } | null)?.errno || null });
        return jsonError("Não foi possível preparar este acesso.", 503);
      }
      bootstrapped = true;
      invite = { name: "Kauan" };
      admin = { name: "Kauan", role: "admin" };
    } catch (error) {
      console.error("admin_bootstrap_failed", { code: (error as { code?: string })?.code });
      return jsonError("Não foi possível preparar este acesso.", 503);
    }
  }
  if (!entitlement && !invite && !admin)
    return NextResponse.json({ message: "Se este e-mail tem uma compra aprovada ou convite, enviaremos as instruções de senha." });
  if (!bootstrapped && (invite || admin) && !entitlement) {
    const { data: existing } = await adminDb.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (!existing.users.some((user) => user.email?.toLowerCase() === email)) {
      const created = await adminDb.auth.admin.createUser({ email, email_confirm: true, user_metadata: { name: invite?.name || admin?.name || "Administrador" } });
      if (created.error && created.error.code !== "email_exists") return jsonError("Não foi possível preparar este acesso.", 503);
    }
  }
  const auth = publicClient();
  if (!auth) return jsonError("Autenticação indisponível.", 503);
  const { error } = await auth.auth.resetPasswordForEmail(email, { redirectTo: `${appUrl}/auth/callback` });
  if (error) return jsonError("Não foi possível enviar as instruções de senha agora.", 503);
  return NextResponse.json({ message: "Enviamos as instruções para criar ou trocar sua senha. Confira sua caixa de entrada e o spam." });
}

