import { createHash, createPublicKey, randomBytes, verify } from "node:crypto";

/**
 * Login com Google (OpenID Connect, Authorization Code + PKCE + state + nonce). Funções puras e testáveis: a montagem da URL,
 * o PKCE, a validação das claims do ID token e a verificação RS256 contra o JWKS do Google. Escopos mínimos: openid email profile.
 */
export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";

export const b64url = (buffer: Buffer) => buffer.toString("base64url");
export function pkce() {
  const verifier = b64url(randomBytes(32));
  return { verifier, challenge: b64url(createHash("sha256").update(verifier).digest()) };
}
export const randomToken = () => b64url(randomBytes(24));

export function authUrl(p: { clientId: string; redirectUri: string; state: string; nonce: string; challenge: string }) {
  const url = new URL(GOOGLE_AUTH_URL);
  url.search = new URLSearchParams({ client_id: p.clientId, redirect_uri: p.redirectUri, response_type: "code", scope: "openid email profile", state: p.state, nonce: p.nonce, code_challenge: p.challenge, code_challenge_method: "S256", prompt: "select_account" }).toString();
  return url.toString();
}

/** Destino pós-login: só caminho interno (nunca `//host`, esquema ou barra invertida) e só áreas conhecidas. */
export function safeRedirect(value: unknown, fallback = "/aluno"): string {
  const v = typeof value === "string" ? value : "";
  if (!v.startsWith("/") || v.startsWith("//") || v.includes("\\") || /[\u0000-\u001f]/.test(v)) return fallback;
  return /^\/(?:aluno|admin)(?:[/?#]|$)/.test(v) ? v : fallback;
}

export type Claims = { iss?: string; aud?: string | string[]; sub?: string; exp?: number; nonce?: string; email?: string; email_verified?: boolean | string; name?: string };

export function claimProblems(claims: Claims, expected: { clientId: string; nonce: string; nowSeconds: number }): string[] {
  const problems: string[] = [];
  if (claims.iss !== "https://accounts.google.com" && claims.iss !== "accounts.google.com") problems.push("emissor inválido");
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!aud.includes(expected.clientId)) problems.push("audiência inválida");
  if (!claims.exp || claims.exp <= expected.nowSeconds) problems.push("token expirado");
  if (!claims.nonce || claims.nonce !== expected.nonce) problems.push("nonce inválido");
  if (!claims.sub) problems.push("sem identificador (sub)");
  if (!claims.email) problems.push("sem e-mail");
  if (claims.email_verified !== true && claims.email_verified !== "true") problems.push("e-mail não verificado pelo Google");
  return problems;
}

type Jwk = { kid?: string; kty: string; alg?: string; n?: string; e?: string };
/** Verifica a assinatura RS256 do JWT com o JWKS informado e devolve as claims (ou null). Não valida as claims: use `claimProblems`. */
export function verifyRs256(token: string, jwks: { keys: Jwk[] }): Claims | null {
  const [h, p, s] = token.split(".");
  if (!h || !p || !s) return null;
  let header: { alg?: string; kid?: string };
  try { header = JSON.parse(Buffer.from(h, "base64url").toString("utf8")); } catch { return null; }
  if (header.alg !== "RS256") return null;
  const jwk = jwks.keys.find((k) => k.kid === header.kid && k.kty === "RSA");
  if (!jwk) return null;
  try {
    const key = createPublicKey({ key: jwk as never, format: "jwk" });
    if (!verify("RSA-SHA256", Buffer.from(`${h}.${p}`), key, Buffer.from(s, "base64url"))) return null;
    return JSON.parse(Buffer.from(p, "base64url").toString("utf8")) as Claims;
  } catch { return null; }
}
