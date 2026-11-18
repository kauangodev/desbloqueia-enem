import { NextResponse } from "next/server";
import { jsonError, sameOrigin } from "../../../lib/http";
import { isClientEvent, sanitizeParams } from "../../../lib/funnel/model";
import { recordEvent } from "../../../lib/funnel/record";

export const dynamic = "force-dynamic";

/**
 * Eventos do navegador (demo, planos vistos, início de cadastro). O cliente só envia com consentimento de métricas;
 * o servidor aceita apenas nomes e parâmetros da lista fechada e responde 204 sem expor nada. Nunca recebe dados pessoais.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  if (Number(req.headers.get("content-length") || 0) > 2048) return jsonError("Solicitação muito grande", 413);
  const body = await req.json().catch(() => null) as { name?: unknown; params?: unknown } | null;
  if (!body || !isClientEvent(body.name)) return jsonError("Evento inválido", 400);
  const params = sanitizeParams(body.params);
  await recordEvent(body.name, { visitorId: params.visitor ?? null, params });
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}