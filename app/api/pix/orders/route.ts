import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, sameOrigin } from "../../../../lib/http";
import { serviceClient, identity } from "../../../../lib/supabase";
import { createOrder } from "../../../../lib/pix/store";

export const dynamic = "force-dynamic";
const body = z.object({ tier: z.enum(["essencial", "premium"]) });

/** Cria (ou reaproveita) o pedido Pix do aluno logado. Sem oferta ativa e válida, responde 409: o grátis continua funcionando. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  const who = await identity();
  if (!who) return jsonError("Entre na sua conta para continuar.", 401);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Plano inválido");
  try {
    const { data: allowed } = await serviceClient().rpc("take_rate_limit", { p_key: `pix-order:${who.user.id}`, p_limit: 12, p_seconds: 3600 });
    if (!allowed) return jsonError("Muitas tentativas. Aguarde um pouco.", 429);
    const result = await createOrder(who.user.id, parsed.data.tier);
    if (!result.ok) return jsonError(result.error, 409);
    return NextResponse.json({ id: result.id, redirect: `/aluno/pagamentos/${result.id}` }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError("Pagamento temporariamente indisponível. Tente novamente.", 503);
  }
}
