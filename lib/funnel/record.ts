import "server-only";
import { mysqlPool } from "../mysql";
import type { EventParams, FunnelEvent } from "./model";

/**
 * Grava um evento do funil. `dedupeKey` garante um único registro por conta/pedido (INSERT IGNORE na chave única):
 * retentativas, duas aprovações simultâneas e recarregamentos não duplicam. Falha de gravação NUNCA derruba o fluxo de negócio.
 */
export async function recordEvent(name: FunnelEvent, ctx: { userId?: string | null; orderId?: string | null; visitorId?: string | null; dedupeKey?: string | null; params?: EventParams }): Promise<boolean> {
  try {
    const [result] = await mysqlPool().query<import("mysql2/promise").ResultSetHeader>(
      "INSERT IGNORE INTO funnel_events (name,visitor_id,user_id,order_id,dedupe_key,params) VALUES (?,?,?,?,?,?)",
      [name, ctx.visitorId ?? null, ctx.userId ?? null, ctx.orderId ?? null, ctx.dedupeKey ?? null, ctx.params ? JSON.stringify(ctx.params) : null],
    );
    return result.affectedRows === 1;
  } catch { return false; }
}