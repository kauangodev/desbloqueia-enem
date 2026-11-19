import { NextResponse } from "next/server";
import { jsonError, sameOrigin } from "../../../../../../lib/http";
import { identity, serviceClient } from "../../../../../../lib/supabase";
import { notifyOrder } from "../../../../../../lib/pix/store";

export const dynamic = "force-dynamic";

/** "Já fiz o Pix": idempotente. Só registra o aviso e muda para "aguardando conferência"; não libera acesso. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  const who = await identity();
  if (!who) return jsonError("Entre na sua conta para continuar.", 401);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return jsonError("Pedido inválido", 404);
  try {
    const { data: allowed } = await serviceClient().rpc("take_rate_limit", { p_key: `pix-notify:${who.user.id}`, p_limit: 30, p_seconds: 3600 });
    if (!allowed) return jsonError("Muitas tentativas. Aguarde um pouco.", 429);
    const result = await notifyOrder(who.user.id, id);
    if (!result.ok) return jsonError(result.error, 409);
    return NextResponse.json({ status: result.status }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError("Não foi possível registrar agora. Tente novamente.", 503);
  }
}
