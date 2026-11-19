import "server-only";
import { mysqlPool } from "../mysql";
import type { EventParams, FunnelEvent } from "./model";

type Ctx = { userId?: string | null; orderId?: string | null; visitorId?: string | null; dedupeKey?: string | null; params?: EventParams };

/** Resultado: "gravado", "duplicado" (a chave única já existia: nada a refazer) ou "falhou" (vale tentar de novo depois). */
export async function recordEventStatus(name: FunnelEvent, ctx: Ctx): Promise<"gravado" | "duplicado" | "falhou"> {
  try {
    const [result] = await mysqlPool().query<import("mysql2/promise").ResultSetHeader>(
      "INSERT IGNORE INTO funnel_events (name,visitor_id,user_id,order_id,dedupe_key,params) VALUES (?,?,?,?,?,?)",
      [name, ctx.visitorId ?? null, ctx.userId ?? null, ctx.orderId ?? null, ctx.dedupeKey ?? null, ctx.params ? JSON.stringify(ctx.params) : null],
    );
    return result.affectedRows === 1 ? "gravado" : "duplicado";
  } catch { return "falhou"; }
}

/**
 * Grava um evento do funil. `dedupeKey` garante um único registro por conta/pedido (INSERT IGNORE na chave única):
 * retentativas, duas aprovações simultâneas e recarregamentos não duplicam. Falha de gravação NUNCA derruba o fluxo de negócio.
 */
export async function recordEvent(name: FunnelEvent, ctx: Ctx): Promise<boolean> {
  return (await recordEventStatus(name, ctx)) === "gravado";
}
