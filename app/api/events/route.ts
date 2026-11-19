import { NextResponse } from "next/server";
import { clientKey, jsonError, rateLimited, sameOrigin } from "../../../lib/http";
import { isClientEvent, sanitizeParams } from "../../../lib/funnel/model";
import { recordEvent } from "../../../lib/funnel/record";

export const dynamic = "force-dynamic";

const MAX_BODY = 2048;

/**
 * Eventos do navegador (demo, planos vistos, início de cadastro). O cliente só envia com consentimento de métricas;
 * o servidor aceita apenas nomes e parâmetros da lista fechada e responde 204 sem expor nada. Nunca recebe dados pessoais.
 * Limites: tamanho real do corpo (não só o cabeçalho) e no máximo 60 eventos por minuto por origem de rede.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  if (rateLimited(`events:${clientKey(req)}`, 60, 60_000)) return jsonError("Muitas solicitações", 429);
  if (Number(req.headers.get("content-length") || 0) > MAX_BODY) return jsonError("Solicitação muito grande", 413);
  const text = await req.text().catch(() => "");
  if (text.length > MAX_BODY) return jsonError("Solicitação muito grande", 413);
  let body: { name?: unknown; params?: unknown } | null = null;
  try { body = JSON.parse(text); } catch { body = null; }
  if (!body || !isClientEvent(body.name)) return jsonError("Evento inválido", 400);
  const params = sanitizeParams(body.params);
  await recordEvent(body.name, { visitorId: params.visitor ?? null, params });
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
