import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { appUrl } from "../../../../../lib/config";
import { claimProblems, GOOGLE_JWKS_URL, GOOGLE_TOKEN_URL, verifyRs256 } from "../../../../../lib/auth/google";
import { features } from "../../../../../lib/features";
import { mysqlPool } from "../../../../../lib/mysql";
import { startSessionForUser } from "../../../../../lib/supabase";
import { TERMS_VERSION } from "../../../../../lib/auth/terms";
import { signPayload } from "../../../../../lib/auth/oauth-cookie";

export const dynamic = "force-dynamic";

function readCookie(raw: string | undefined) {
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !signature) return null;
  const expected = signPayload(payload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try { const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { state: string; nonce: string; verifier: string; redirect: string; terms: boolean; marketing: boolean; exp: number }; return data.exp > Date.now() ? data : null; } catch { return null; }
}
const back = (code: string) => { const r = NextResponse.redirect(`${appUrl}/entrar?erro=${code}`, 303); r.cookies.delete({ name: "gd_oauth", path: "/api/auth/google" }); return r; };

/**
 * Retorno do Google: confere state, troca o código (PKCE), valida assinatura e claims do ID token e usa (google, sub) como identidade.
 * Colisão de e-mail com conta GoDev existente NÃO vincula automaticamente: pede entrada com a conta original (prova de posse).
 */
export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID; const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!features.gratis || !features.google || !clientId || !secret) return new NextResponse("Indisponível", { status: 404 });
  const url = new URL(req.url);
  const cookie = readCookie(req.headers.get("cookie")?.split(/;\s*/).find((c) => c.startsWith("gd_oauth="))?.slice(9));
  const state = url.searchParams.get("state"); const code = url.searchParams.get("code");
  if (!cookie || !state || state !== cookie.state) return back("google-sessao");
  if (url.searchParams.get("error") || !code) return back("google-cancelado");
  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: clientId, client_secret: secret, redirect_uri: `${appUrl}/api/auth/google/callback`, grant_type: "authorization_code", code_verifier: cookie.verifier }) });
    if (!tokenRes.ok) return back("google-indisponivel");
    const { id_token: idToken } = (await tokenRes.json()) as { id_token?: string };
    const jwks = await fetch(GOOGLE_JWKS_URL).then((r) => r.json());
    const claims = idToken ? verifyRs256(idToken, jwks) : null;
    if (!claims || claimProblems(claims, { clientId, nonce: cookie.nonce, nowSeconds: Math.floor(Date.now() / 1000) }).length) return back("google-invalido");
    const sub = claims.sub!; const email = claims.email!.trim().toLowerCase();

    const pool = mysqlPool();
    const [known] = await pool.query<{ user_id: string }[] & import("mysql2/promise").RowDataPacket[]>("SELECT user_id FROM auth_identities WHERE provider = 'google' AND subject = ? LIMIT 1", [sub]);
    let userId: string | null = known[0]?.user_id ?? null;
    if (!userId) {
      const [byEmail] = await pool.query<import("mysql2/promise").RowDataPacket[]>("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
      if (byEmail[0]) return back("google-existente"); // prova de posse da conta GoDev antes de vincular
      if (!cookie.terms) return back("google-termos");
      const id = randomUUID();
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query("INSERT INTO users (id,email,name,role,email_verified_at,signup_source,terms_version,terms_accepted_at,marketing_optin) VALUES (?,?,?,'student',CURRENT_TIMESTAMP(3),'google',?,CURRENT_TIMESTAMP(3),?)", [id, email, String(claims.name || "Aluno").slice(0, 120), TERMS_VERSION, cookie.marketing]);
        await conn.query("INSERT INTO auth_identities (provider,subject,user_id) VALUES ('google',?,?)", [sub, id]);
        await conn.commit();
        userId = id;
      } catch (error) {
        await conn.rollback();
        // Duas requisições simultâneas: a identidade (provider, sub) é única; a perdedora reaproveita a conta já criada.
        if ((error as { code?: string }).code !== "ER_DUP_ENTRY") throw error;
        const [again] = await pool.query<import("mysql2/promise").RowDataPacket[]>("SELECT user_id FROM auth_identities WHERE provider = 'google' AND subject = ? LIMIT 1", [sub]);
        userId = again[0]?.user_id ?? null;
      } finally { conn.release(); }
    }
    if (!userId || !(await startSessionForUser(userId))) return back("google-conta");
    const response = NextResponse.redirect(`${appUrl}${cookie.redirect}`, 303);
    response.cookies.delete({ name: "gd_oauth", path: "/api/auth/google" });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return back("google-indisponivel");
  }
}
