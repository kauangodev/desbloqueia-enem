import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, sameOrigin } from "../../../../lib/http";
import { requireAdmin } from "../../../../lib/pix/auth";
import { activateOffer, confirmOrder, noteOrder, refundOrder, saveOfferDraft } from "../../../../lib/pix/store";

export const dynamic = "force-dynamic";
const tier = z.enum(["essencial", "premium"]);
const id = z.string().uuid();
const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("offerDraft"), tier, cents: z.number().int().min(100).max(1000000), receiverName: z.string().trim().min(2).max(160), copyPaste: z.string().trim().max(600).nullable(), reviewMinutes: z.number().int().min(60).max(10080) }),
  z.object({ action: z.literal("offerActivate"), code: z.string().regex(/^(essencial|premium)-v\d{1,4}$/) }),
  z.object({ action: z.literal("confirm"), orderId: id, bankRef: z.string().trim().min(8).max(64), amountCents: z.number().int().positive(), receivedAt: z.string().min(10).max(40), receiver: z.string().trim().min(2).max(160) }),
  z.object({ action: z.literal("refund"), orderId: id, reference: z.string().trim().min(8).max(64) }),
  z.object({ action: z.literal("note"), orderId: id, note: z.string().trim().min(3).max(500) }),
]);

/** Ações do operador. Cada ação exige a permissão própria no servidor; confirmar e reembolsar são auditadas. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Origem inválida", 403);
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Dados inválidos");
  const input = parsed.data;
  const needs = input.action === "offerDraft" || input.action === "offerActivate" ? "billing.manage" : "payments.reconcile";
  const who = await requireAdmin(needs);
  if (!who) return jsonError("Sem permissão para esta ação.", 403);
  try {
    switch (input.action) {
      case "offerDraft": return NextResponse.json({ code: await saveOfferDraft(who.user.id, input) });
      case "offerActivate": { const r = await activateOffer(who.user.id, input.code); return r.ok ? NextResponse.json({ ok: true }) : jsonError(`Não foi possível ativar: ${r.error}`, 409); }
      case "confirm": { const r = await confirmOrder(who.user.id, input.orderId, { bankRef: input.bankRef, amountCents: input.amountCents, receivedAt: input.receivedAt, receiver: input.receiver }); return r.ok ? NextResponse.json(r) : jsonError(r.error, 409); }
      case "refund": { const r = await refundOrder(who.user.id, input.orderId, input.reference); return r.ok ? NextResponse.json(r) : jsonError(r.error, 409); }
      case "note": await noteOrder(who.user.id, input.orderId, input.note); return NextResponse.json({ ok: true });
    }
  } catch {
    return jsonError("Não foi possível concluir agora.", 503);
  }
}
