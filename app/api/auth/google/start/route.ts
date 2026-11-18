import { NextResponse } from "next/server";
import { appUrl } from "../../../../../lib/config";
import { authUrl, pkce, randomToken, safeRedirect } from "../../../../../lib/auth/google";
import { features } from "../../../../../lib/features";
import { signPayload } from "../../../../../lib/auth/oauth-cookie";

export const dynamic = "force-dynamic";


/**
 * Início do login com Google. Guarda state, nonce e o verificador PKCE num cookie HttpOnly assinado de 10 minutos.
 * Fica indisponível (404) sem a chave de funcionalidade ou sem GOOGLE_CLIENT_ID/SECRET no ambiente do servidor.
 */
export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!features.gratis || !features.google || !clientId || !process.env.GOOGLE_CLIENT_SECRET) return new NextResponse("Indisponível", { status: 404 });
  const params = new URL(req.url).searchParams;
  const state = randomToken();
  const nonce = randomToken();
  const { verifier, challenge } = pkce();
  const payload = Buffer.from(JSON.stringify({ state, nonce, verifier, redirect: safeRedirect(params.get("redirect")), terms: params.get("terms") === "1", marketing: params.get("marketing") === "1", exp: Date.now() + 10 * 60 * 1000 })).toString("base64url");
  const response = NextResponse.redirect(authUrl({ clientId, redirectUri: `${appUrl}/api/auth/google/callback`, state, nonce, challenge }), 303);
  response.cookies.set("gd_oauth", `${payload}.${signPayload(payload)}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/auth/google", maxAge: 600 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
