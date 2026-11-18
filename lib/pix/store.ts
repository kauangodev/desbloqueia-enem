import "server-only";
import { randomUUID } from "node:crypto";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { mysqlPool } from "../mysql";
import { bankRefInUse, confirm, expire, notifyPaid, refund, type Evidence, type PixOrder, type PixStatus } from "./orders";
import { validatePixOffer } from "./payload";

/**
 * Persistência dos pedidos Pix (MySQL). As regras de estado vêm de `orders.ts` (puras); aqui ficam transação, trava por pedido,
 * unicidade da referência bancária e a concessão do direito. O direito é uma linha em `entitlements` com order_id "pix:<id>",
 * independente das compras da Cakto: reembolso revoga só essa linha.
 */
export type OfferRow = { code: string; tier: "essencial" | "premium"; version: number; cents: number; status: "rascunho" | "ativa" | "encerrada"; receiverName: string; copyPaste: string | null; reviewMinutes: number; validFrom: string | null; validUntil: string | null };
export type OrderView = PixOrder & { tier: "essencial" | "premium"; notifiedAt: string | null; createdAt: string; email?: string; name?: string };

const ORDER_TTL_HOURS = Math.max(1, Number(process.env.PIX_ORDER_TTL_HOURS) || 72);
const iso = (value: unknown) => (value ? new Date(value as string).toISOString() : "");
const day = (value: unknown) => (value ? new Date(value as string).toISOString().slice(0, 10) : null);

const offerOf = (r: RowDataPacket): OfferRow => ({ code: r.code, tier: r.tier, version: Number(r.version), cents: Number(r.cents), status: r.status, receiverName: r.receiver_name || "", copyPaste: r.copy_paste ?? null, reviewMinutes: Number(r.review_minutes), validFrom: day(r.valid_from), validUntil: day(r.valid_until) });
const orderOf = (r: RowDataPacket): OrderView => ({
  id: r.id, userId: r.user_id, offerCode: r.offer_code, offerVersion: Number(r.offer_version), expectedCents: Number(r.expected_cents), status: r.status as PixStatus,
  expiresAt: iso(r.expires_at), bankRef: r.bank_ref ?? null, tier: String(r.offer_code).startsWith("premium") ? "premium" : "essencial",
  notifiedAt: r.notified_at ? iso(r.notified_at) : null, createdAt: iso(r.created_at), email: r.email, name: r.name,
});

async function tx<T>(work: (c: PoolConnection) => Promise<T>): Promise<T> {
  const c = await mysqlPool().getConnection();
  try { await c.beginTransaction(); const out = await work(c); await c.commit(); return out; } catch (error) { await c.rollback(); throw error; } finally { c.release(); }
}
const event = (c: PoolConnection | ReturnType<typeof mysqlPool>, orderId: string, actor: string | null, name: string, detail?: unknown) =>
  c.query("INSERT INTO pix_order_events (order_id,actor,event,detail) VALUES (?,?,?,?)", [orderId, actor, name, detail ? JSON.stringify(detail) : null]);
const audit = (c: PoolConnection, actor: string, action: string, target: string) => c.query("INSERT INTO audit_logs (actor,action,target) VALUES (?,?,?)", [actor, action, target]);

/* ---------- ofertas ---------- */
export async function listOffers(): Promise<OfferRow[]> {
  const [rows] = await mysqlPool().query<RowDataPacket[]>("SELECT * FROM pix_offers ORDER BY tier, version DESC");
  return rows.map(offerOf);
}

export function offerProblems(offer: Pick<OfferRow, "cents" | "receiverName" | "copyPaste">): string[] {
  if (!offer.copyPaste) return ["falta o Pix Copia e Cola gerado no banco"];
  return validatePixOffer(offer.copyPaste, { cents: offer.cents, receiverName: offer.receiverName });
}

export async function saveOfferDraft(actor: string, input: { tier: "essencial" | "premium"; cents: number; receiverName: string; copyPaste: string | null; reviewMinutes: number }) {
  return tx(async (c) => {
    const [max] = await c.query<RowDataPacket[]>("SELECT COALESCE(MAX(version),0) AS v FROM pix_offers WHERE tier = ? FOR UPDATE", [input.tier]);
    const version = Number(max[0].v) + 1;
    const code = `${input.tier}-v${version}`;
    await c.query("INSERT INTO pix_offers (code,tier,version,cents,status,receiver_name,copy_paste,review_minutes) VALUES (?,?,?,?, 'rascunho', ?,?,?)", [code, input.tier, version, input.cents, input.receiverName.trim(), input.copyPaste?.trim() || null, input.reviewMinutes]);
    await audit(c, actor, "pix.offer.draft", code);
    return code;
  });
}

/** Ativa depois da prévia: exige código válido (CRC, valor e recebedor). A oferta anterior do plano é encerrada; pedidos antigos mantêm preço e versão. */
export async function activateOffer(actor: string, code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  return tx(async (c) => {
    const [rows] = await c.query<RowDataPacket[]>("SELECT * FROM pix_offers WHERE code = ? FOR UPDATE", [code]);
    if (!rows[0]) return { ok: false as const, error: "oferta não encontrada" };
    const offer = offerOf(rows[0]);
    const problems = offerProblems(offer);
    if (problems.length) return { ok: false as const, error: problems.join("; ") };
    await c.query("UPDATE pix_offers SET status = 'encerrada' WHERE tier = ? AND status = 'ativa' AND code <> ?", [offer.tier, code]);
    await c.query("UPDATE pix_offers SET status = 'ativa', activated_by = ?, activated_at = CURRENT_TIMESTAMP(3) WHERE code = ?", [actor, code]);
    await audit(c, actor, "pix.offer.activate", code);
    return { ok: true as const };
  });
}

export async function activeOffer(tier: "essencial" | "premium"): Promise<OfferRow | null> {
  const [rows] = await mysqlPool().query<RowDataPacket[]>("SELECT * FROM pix_offers WHERE tier = ? AND status = 'ativa' AND (valid_from IS NULL OR valid_from <= CURRENT_DATE) AND (valid_until IS NULL OR valid_until >= CURRENT_DATE) ORDER BY version DESC LIMIT 1", [tier]);
  const offer = rows[0] ? offerOf(rows[0]) : null;
  // Defesa em profundidade: mesmo "ativa", só vende se o código ainda for válido.
  return offer && offerProblems(offer).length === 0 ? offer : null;
}

export async function offerByCode(code: string): Promise<OfferRow | null> {
  const [rows] = await mysqlPool().query<RowDataPacket[]>("SELECT * FROM pix_offers WHERE code = ? LIMIT 1", [code]);
  return rows[0] ? offerOf(rows[0]) : null;
}

/* ---------- pedidos do aluno ---------- */
export async function createOrder(userId: string, tier: "essencial" | "premium"): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const offer = await activeOffer(tier);
  if (!offer) return { ok: false, error: "O pagamento por Pix deste plano ainda não está disponível." };
  return tx(async (c) => {
    // Pedido aberto do mesmo plano é reaproveitado (clique repetido não cria pedidos duplicados).
    const [open] = await c.query<RowDataPacket[]>("SELECT id FROM pix_orders WHERE user_id = ? AND offer_code = ? AND status IN ('aguardando_pix','em_conferencia') AND expires_at > CURRENT_TIMESTAMP(3) ORDER BY created_at DESC LIMIT 1 FOR UPDATE", [userId, offer.code]);
    if (open[0]) return { ok: true as const, id: open[0].id as string };
    const id = randomUUID();
    await c.query("INSERT INTO pix_orders (id,user_id,offer_code,offer_version,expected_cents,status,expires_at) VALUES (?,?,?,?,?, 'aguardando_pix', DATE_ADD(CURRENT_TIMESTAMP(3), INTERVAL ? HOUR))", [id, userId, offer.code, offer.version, offer.cents, ORDER_TTL_HOURS]);
    await event(c, id, userId, "criado", { cents: offer.cents, offer: offer.code });
    return { ok: true as const, id };
  });
}

export async function orderForUser(userId: string, id: string): Promise<OrderView | null> {
  const [rows] = await mysqlPool().query<RowDataPacket[]>("SELECT * FROM pix_orders WHERE id = ? AND user_id = ? LIMIT 1", [id, userId]);
  return rows[0] ? orderOf(rows[0]) : null;
}
export async function ordersOfUser(userId: string): Promise<OrderView[]> {
  const [rows] = await mysqlPool().query<RowDataPacket[]>("SELECT * FROM pix_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 50", [userId]);
  return rows.map(orderOf);
}

export async function notifyOrder(userId: string, id: string): Promise<{ ok: true; status: PixStatus } | { ok: false; error: string }> {
  return tx(async (c) => {
    const [rows] = await c.query<RowDataPacket[]>("SELECT * FROM pix_orders WHERE id = ? AND user_id = ? FOR UPDATE", [id, userId]);
    if (!rows[0]) return { ok: false as const, error: "pedido não encontrado" };
    const result = notifyPaid(orderOf(rows[0]));
    if (!result.ok) return { ok: false as const, error: result.error };
    if (result.changed) {
      await c.query("UPDATE pix_orders SET status = 'em_conferencia', notified_at = CURRENT_TIMESTAMP(3) WHERE id = ?", [id]);
      await event(c, id, userId, "aviso_do_aluno");
    }
    return { ok: true as const, status: result.value.status };
  });
}

/* ---------- operação (admin) ---------- */
export async function adminOrders(filter: { status?: string; q?: string; page?: number }): Promise<{ rows: OrderView[]; total: number; page: number; pageSize: number }> {
  const pageSize = 20;
  const page = Math.max(1, Math.floor(filter.page || 1));
  const where: string[] = []; const args: unknown[] = [];
  if (filter.status && ["aguardando_pix", "em_conferencia", "pago", "expirado", "cancelado", "reembolsado"].includes(filter.status)) { where.push("o.status = ?"); args.push(filter.status); }
  const q = (filter.q || "").trim().slice(0, 80);
  if (q) { where.push("(o.id LIKE ? OR u.email LIKE ? OR u.name LIKE ? OR o.bank_ref LIKE ?)"); args.push(`${q}%`, `%${q}%`, `%${q}%`, `${q}%`); }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const base = `FROM pix_orders o JOIN users u ON u.id = o.user_id ${clause}`;
  const [count] = await mysqlPool().query<RowDataPacket[]>(`SELECT COUNT(*) AS n ${base}`, args);
  const [rows] = await mysqlPool().query<RowDataPacket[]>(`SELECT o.*, u.email, u.name ${base} ORDER BY FIELD(o.status,'em_conferencia','aguardando_pix','expirado','pago','reembolsado','cancelado'), o.created_at DESC LIMIT ? OFFSET ?`, [...args, pageSize, (page - 1) * pageSize]);
  return { rows: rows.map(orderOf), total: Number(count[0].n), page, pageSize };
}

export async function expireDue(): Promise<number> {
  const [result] = await mysqlPool().query<ResultSetHeader>("UPDATE pix_orders SET status = 'expirado' WHERE status = 'aguardando_pix' AND expires_at <= CURRENT_TIMESTAMP(3)");
  return result.affectedRows;
}
export { expire };

export async function confirmOrder(actor: string, id: string, evidence: Evidence): Promise<{ ok: true; status: PixStatus; changed: boolean } | { ok: false; error: string }> {
  try {
    return await tx(async (c) => {
      const [rows] = await c.query<RowDataPacket[]>("SELECT * FROM pix_orders WHERE id = ? FOR UPDATE", [id]);
      if (!rows[0]) return { ok: false as const, error: "pedido não encontrado" };
      const order = orderOf(rows[0]);
      const [others] = await c.query<RowDataPacket[]>("SELECT id, bank_ref AS bankRef FROM pix_orders WHERE bank_ref = ? AND id <> ?", [evidence.bankRef, id]);
      if (bankRefInUse(others.map((o) => ({ ...order, id: o.id, bankRef: o.bankRef })), evidence.bankRef, id)) return { ok: false as const, error: "esta referência bancária já confirmou outro pedido" };
      const result = confirm(order, evidence);
      if (!result.ok) return { ok: false as const, error: result.error };
      if (result.changed) {
        const [users] = await c.query<RowDataPacket[]>("SELECT email FROM users WHERE id = ? LIMIT 1", [order.userId]);
        if (!users[0]) return { ok: false as const, error: "aluno não encontrado" };
        await c.query("UPDATE pix_orders SET status = 'pago', bank_ref = ?, confirmed_by = ?, confirmed_at = CURRENT_TIMESTAMP(3) WHERE id = ?", [evidence.bankRef, actor, id]);
        await c.query("INSERT INTO entitlements (order_id,user_id,email,plan,active) VALUES (?,?,?,?,TRUE) ON DUPLICATE KEY UPDATE active = TRUE, user_id = VALUES(user_id)", [`pix:${id}`, order.userId, users[0].email, order.tier]);
        await event(c, id, actor, "confirmado", { bankRef: evidence.bankRef, amountCents: evidence.amountCents, receivedAt: evidence.receivedAt, receiver: evidence.receiver });
        await audit(c, actor, "pix.order.confirm", id);
      }
      return { ok: true as const, status: result.value.status, changed: result.changed };
    });
  } catch (error) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") return { ok: false, error: "esta referência bancária já confirmou outro pedido" };
    return { ok: false, error: "não foi possível confirmar agora" };
  }
}

export async function refundOrder(actor: string, id: string, reference: string): Promise<{ ok: true; changed: boolean } | { ok: false; error: string }> {
  return tx(async (c) => {
    const [rows] = await c.query<RowDataPacket[]>("SELECT * FROM pix_orders WHERE id = ? FOR UPDATE", [id]);
    if (!rows[0]) return { ok: false as const, error: "pedido não encontrado" };
    const result = refund(orderOf(rows[0]), reference);
    if (!result.ok) return { ok: false as const, error: result.error };
    if (result.changed) {
      await c.query("UPDATE pix_orders SET status = 'reembolsado' WHERE id = ?", [id]);
      await c.query("UPDATE entitlements SET active = FALSE WHERE order_id = ?", [`pix:${id}`]);
      await event(c, id, actor, "reembolsado", { reference });
      await audit(c, actor, "pix.order.refund", id);
    }
    return { ok: true as const, changed: result.changed };
  });
}

export async function noteOrder(actor: string, id: string, note: string) {
  await event(mysqlPool(), id, actor, "nota_do_operador", { note: note.slice(0, 500) });
}

export async function eventsOf(id: string): Promise<{ event: string; actor: string | null; at: string }[]> {
  const [rows] = await mysqlPool().query<RowDataPacket[]>("SELECT event, actor, created_at FROM pix_order_events WHERE order_id = ? ORDER BY id", [id]);
  return rows.map((r) => ({ event: r.event, actor: r.actor, at: iso(r.created_at) }));
}
