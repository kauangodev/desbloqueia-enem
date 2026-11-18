/**
 * Máquina de estados do pedido Pix (pura). Pedido, aviso do aluno e direito são conceitos separados:
 * "Já fiz o Pix" só move para `em_conferencia`; quem concede o direito é a confirmação do operador com evidência bancária.
 */
export type PixStatus = "aguardando_pix" | "em_conferencia" | "pago" | "expirado" | "cancelado" | "reembolsado";

export type PixOrder = {
  id: string;
  userId: string;
  offerCode: string;
  offerVersion: number;
  expectedCents: number;
  status: PixStatus;
  expiresAt: string;
  /** Identificador bancário (EndToEndId ou referência inequívoca) do crédito que confirmou o pedido. */
  bankRef: string | null;
};

export type Evidence = { bankRef: string; amountCents: number; receivedAt: string; receiver: string };
export type Result<T> = { ok: true; value: T; changed: boolean } | { ok: false; error: string };

const bankRefOk = (ref: string) => /^[A-Za-z0-9_-]{8,64}$/.test(ref);

/** "Já fiz o Pix": idempotente. Só vale para pedido aguardando ou já em conferência. */
export function notifyPaid(order: PixOrder): Result<PixOrder> {
  if (order.status === "em_conferencia") return { ok: true, value: order, changed: false };
  if (order.status !== "aguardando_pix") return { ok: false, error: "pedido não aceita aviso neste estado" };
  return { ok: true, value: { ...order, status: "em_conferencia" }, changed: true };
}

/**
 * Confirmação pelo operador. Exige evidência com identificador bancário e valor igual ao esperado. Repetir a confirmação
 * com a mesma referência devolve o estado persistido; outra referência em pedido já pago é erro (não libera duas vezes).
 * Pedido expirado pode ser confirmado (pagamento tardio) porque o código estático segue pagável: a decisão é do operador.
 */
export function confirm(order: PixOrder, evidence: Evidence): Result<PixOrder> {
  if (order.status === "pago") return order.bankRef === evidence.bankRef ? { ok: true, value: order, changed: false } : { ok: false, error: "pedido já pago com outra referência" };
  if (order.status === "cancelado" || order.status === "reembolsado") return { ok: false, error: "pedido encerrado" };
  if (!bankRefOk(evidence.bankRef)) return { ok: false, error: "informe o identificador bancário da transação" };
  if (evidence.amountCents !== order.expectedCents) return { ok: false, error: "valor recebido diferente do esperado: registre como divergência" };
  return { ok: true, value: { ...order, status: "pago", bankRef: evidence.bankRef }, changed: true };
}

/** A referência bancária identifica UM crédito: não pode confirmar outro pedido. */
export const bankRefInUse = (orders: PixOrder[], bankRef: string, exceptId: string) => orders.some((o) => o.id !== exceptId && o.bankRef === bankRef);

export function expire(order: PixOrder, now: Date): Result<PixOrder> {
  if (order.status !== "aguardando_pix" && order.status !== "em_conferencia") return { ok: true, value: order, changed: false };
  if (new Date(order.expiresAt).getTime() > now.getTime()) return { ok: true, value: order, changed: false };
  // Com aviso do aluno o pedido NÃO expira sozinho: o operador decide.
  if (order.status === "em_conferencia") return { ok: true, value: order, changed: false };
  return { ok: true, value: { ...order, status: "expirado" }, changed: true };
}

/** Reembolso confirmado no banco: revoga só o direito deste pedido (feito pelo chamador). */
export function refund(order: PixOrder, reference: string): Result<PixOrder> {
  if (order.status === "reembolsado") return { ok: true, value: order, changed: false };
  if (order.status !== "pago") return { ok: false, error: "só pedido pago pode ser reembolsado" };
  if (!bankRefOk(reference)) return { ok: false, error: "informe a referência da devolução" };
  return { ok: true, value: { ...order, status: "reembolsado" }, changed: true };
}
