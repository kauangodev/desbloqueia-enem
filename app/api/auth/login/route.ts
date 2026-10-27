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
  const password = typeof input?.password === "string" ? input.password : null;
  const requestedRedirect = typeof input?.redirect === "string" ? input.redirect : "";
  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  )
    return jsonError("Informe um e-mail válido.");
  if (!password || password.length < 8)
    return jsonError("Informe a senha com pelo menos 8 caracteres.");
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const adminDb = serviceClient();
    const hash = createHash("sha256").update(normalizedEmail).digest("hex");
    const { data: allowed, error: limitError } = await adminDb.rpc(
      "take_rate_limit",
      { p_key: `login:${hash}`, p_limit: 5, p_seconds: 300 },
    );
    if (limitError || !allowed)
      return jsonError(
        "Aguarde alguns minutos antes de tentar novamente.",
        429,
      );
    const [{ data: entitlement, error: entitlementError }, { data: invite, error: inviteError }, { data: admin, error: adminError }] = await Promise.all([
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
      adminDb
        .from("profiles")
        .select("name,role")
        .eq("email", normalizedEmail)
        .maybeSingle(),
    ]);
    if (entitlementError || inviteError || adminError) {
      console.error("auth_access_lookup_failed", {
        entitlement: (entitlementError as { code?: string; errno?: number } | null)?.code || (entitlementError as { errno?: number } | null)?.errno || null,
        invite: (inviteError as { code?: string; errno?: number } | null)?.code || (inviteError as { errno?: number } | null)?.errno || null,
        admin: (adminError as { code?: string; errno?: number } | null)?.code || (adminError as { errno?: number } | null)?.errno || null,
      });
      return jsonError("Não foi possível verificar o acesso. Tente novamente mais tarde.", 503);
    }
    const isAdmin = String(admin?.role || "").trim().toLowerCase() === "admin";
    if (!entitlement && !invite && !isAdmin)
      return jsonError("E-mail ou senha inválidos.", 401);
    const { data: signedIn, error } = await db.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) {
      console.error("auth_email_failed", { code: error.code, status: error.status });
      return jsonError(
        error.status === 429 ? "Muitas tentativas. Aguarde alguns minutos." : "E-mail ou senha inválidos.",
        error.status === 429 ? 429 : 401,
      );
    }
    await adminDb.rpc("clear_rate_limit", { p_key: `login:${hash}` });
    const { data: profile } = await db.from("profiles").select("role").eq("id", signedIn.user.id).maybeSingle();
    const role = String(profile?.role || signedIn.user.role || "").trim().toLowerCase();
    const safeRedirect = /^\/(?:admin|aluno)(?:[/?#]|$)/.test(requestedRedirect) ? requestedRedirect : "";
    const destination = role === "admin" && safeRedirect ? safeRedirect : role === "admin" ? "/admin" : "/aluno";
    return NextResponse.json({
      redirect: `${appUrl}${signedIn.user.must_change_password ? `/definir-senha?first=1${safeRedirect ? `&redirect=${encodeURIComponent(safeRedirect)}` : ""}` : destination}`,
    });
  } catch {
    return jsonError("Serviço temporariamente indisponível.", 503);
  }
}
