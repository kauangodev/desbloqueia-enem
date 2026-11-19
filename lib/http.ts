import { NextResponse } from "next/server";
import { appUrl } from "./config";
export const jsonError = (error: string, status = 400) =>
  NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
const hits = new Map<string, number[]>();
/** Limite simples por chave (janela deslizante, em memória do processo). Devolve true quando a chamada deve ser recusada. */
export function rateLimited(key: string, max: number, windowMs: number, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) { hits.set(key, recent); return true; }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return false;
}
export const clientKey = (request: Request) => (request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anon").split(",")[0].trim().slice(0, 64);
export function sameOrigin(request: Request) {
  const allowed = new Set([new URL(appUrl).origin]);
  if (process.env.NODE_ENV !== "production")
    allowed.add(new URL(request.url).origin);
  return allowed.has(request.headers.get("origin") || "");
}
