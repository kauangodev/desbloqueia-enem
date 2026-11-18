import assert from "node:assert/strict";
import test from "node:test";
import { consumeDaily, currentOffer, rightsFor, saoPauloDay, validateOffer, type Offer } from "../lib/planos/model";
import { bankRefInUse, confirm, expire, notifyPaid, refund, type PixOrder } from "../lib/pix/orders";
import { crc16, parsePix, validatePixOffer } from "../lib/pix/payload";

const tl = (id: string, value: string) => `${id}${String(value.length).padStart(2, "0")}${value}`;
/** Código SINTÉTICO de teste (chave e recebedor fictícios). */
function synthetic(amount: string | null, name = "GODEV TESTE", init = "11") {
  const account = tl("26", tl("00", "br.gov.bcb.pix") + tl("01", "teste@exemplo.invalid"));
  const body = tl("00", "01") + tl("01", init) + account + tl("52", "0000") + tl("53", "986") + (amount ? tl("54", amount) : "") + tl("58", "BR") + tl("59", name) + tl("60", "SAO PAULO") + tl("62", tl("05", "***")) + "6304";
  return body + crc16(body);
}

test("pix: CRC, valor, recebedor e tipo estático são lidos do código", () => {
  const info = parsePix(synthetic("10.90"))!;
  assert.equal(info.crcOk, true);
  assert.equal(info.amountCents, 1090);
  assert.equal(info.receiverName, "GODEV TESTE");
  assert.equal(info.initiation, "estatico");
  assert.equal(parsePix(synthetic("10.90", "GODEV TESTE", "12"))!.initiation, "dinamico");
});

test("pix: validação da oferta recusa CRC alterado, valor divergente, sem valor e recebedor diferente", () => {
  const ok = synthetic("10.90");
  assert.deepEqual(validatePixOffer(ok, { cents: 1090, receiverName: "godev teste" }), []);
  assert.match(validatePixOffer(ok.slice(0, -1) + (ok.endsWith("0") ? "1" : "0"), { cents: 1090, receiverName: "GODEV TESTE" }).join(), /CRC/);
  assert.match(validatePixOffer(ok, { cents: 1990, receiverName: "GODEV TESTE" }).join(), /difere do valor/);
  assert.match(validatePixOffer(synthetic(null), { cents: 1090, receiverName: "GODEV TESTE" }).join(), /valor fixo/);
  assert.match(validatePixOffer(ok, { cents: 1090, receiverName: "OUTRA PESSOA" }).join(), /recebedor/);
  assert.match(validatePixOffer("texto qualquer", { cents: 1090, receiverName: "x" }).join(), /válido/);
});

const order = (over: Partial<PixOrder> = {}): PixOrder => ({ id: "o1", userId: "u1", offerCode: "essencial-v1", offerVersion: 1, expectedCents: 1090, status: "aguardando_pix", expiresAt: "2026-12-01T12:00:00Z", bankRef: null, ...over });
const ev = (over = {}) => ({ bankRef: "E1234567890ABCDEF", amountCents: 1090, receivedAt: "2026-11-30T10:00:00Z", receiver: "GODEV TESTE", ...over });

test("pedido: 'já fiz o Pix' é idempotente e não concede direito", () => {
  const a = notifyPaid(order());
  assert.ok(a.ok && a.changed && a.value.status === "em_conferencia");
  const b = notifyPaid(a.ok ? a.value : order());
  assert.ok(b.ok && !b.changed);
  assert.equal(notifyPaid(order({ status: "pago" })).ok, false);
});

test("pedido: confirmação exige referência bancária e valor igual; repetir é idempotente; outra referência não paga de novo", () => {
  assert.equal(confirm(order(), ev({ bankRef: "x" })).ok, false);
  assert.equal(confirm(order(), ev({ amountCents: 1000 })).ok, false);
  const paid = confirm(order({ status: "em_conferencia" }), ev());
  assert.ok(paid.ok && paid.changed && paid.value.status === "pago" && paid.value.bankRef === "E1234567890ABCDEF");
  const again = confirm(paid.ok ? paid.value : order(), ev());
  assert.ok(again.ok && !again.changed);
  assert.equal(confirm(paid.ok ? paid.value : order(), ev({ bankRef: "E999999999999999" })).ok, false);
  assert.equal(confirm(order({ status: "cancelado" }), ev()).ok, false);
});

test("pedido: pagamento tardio pode ser confirmado pelo operador; com aviso do aluno não expira sozinho", () => {
  const late = expire(order(), new Date("2026-12-02T00:00:00Z"));
  assert.ok(late.ok && late.value.status === "expirado");
  assert.ok(confirm(late.ok ? late.value : order(), ev()).ok);
  const noticed = expire(order({ status: "em_conferencia" }), new Date("2026-12-02T00:00:00Z"));
  assert.ok(noticed.ok && noticed.value.status === "em_conferencia");
});

test("pedido: a mesma referência bancária não confirma dois pedidos; reembolso só de pedido pago", () => {
  assert.equal(bankRefInUse([order({ id: "a", bankRef: "E1234567890ABCDEF" })], "E1234567890ABCDEF", "b"), true);
  assert.equal(bankRefInUse([order({ id: "a", bankRef: "E1234567890ABCDEF" })], "E1234567890ABCDEF", "a"), false);
  assert.equal(refund(order(), "D12345678").ok, false);
  assert.ok(refund(order({ status: "pago", bankRef: "E1234567890ABCDEF" }), "D12345678").ok);
});

test("direitos: conta verificada sem compra é Grátis; maior nível ativo vence; reembolso remove só aquele pedido; plano desconhecido é ignorado", () => {
  assert.equal(rightsFor([], false), null);
  assert.equal(rightsFor([], true)!.tier, "gratis");
  const both = [{ orderId: "a", plan: "essencial", active: true }, { orderId: "b", plan: "premium", active: true }];
  assert.equal(rightsFor(both, true)!.tier, "premium");
  assert.equal(rightsFor([both[0], { ...both[1], active: false }], true)!.tier, "essencial");
  assert.equal(rightsFor([{ orderId: "c", plan: "ouro", active: true }], true)!.tier, "gratis");
});

test("ofertas: valor inteiro em centavos, vigência e versão mais recente", () => {
  const base: Offer = { code: "essencial-v1", tier: "essencial", version: 1, cents: 1090, currency: "BRL", status: "ativa", validFrom: null, validUntil: null };
  assert.deepEqual(validateOffer(base), []);
  assert.ok(validateOffer({ ...base, cents: 10.9 }).length > 0);
  const v2 = { ...base, code: "essencial-v2", version: 2, cents: 1290, validFrom: "2027-01-01" };
  assert.equal(currentOffer([base, v2], "essencial", "2026-12-31")!.version, 1);
  assert.equal(currentOffer([base, v2], "essencial", "2027-01-01")!.version, 2);
  assert.equal(currentOffer([{ ...base, status: "rascunho" }], "essencial", "2026-12-31"), null);
});

test("cota diária: consome por ação válida, sem duplicar, com janela em America/Sao_Paulo", () => {
  let uses: { key: string; day: string }[] = [];
  const day = saoPauloDay(new Date("2026-11-18T01:30:00Z")); // ainda 17/11 em São Paulo
  assert.equal(day, "2026-11-17");
  for (const key of ["q1", "q2"]) uses = consumeDaily(uses, key, day, 2).uses;
  assert.equal(consumeDaily(uses, "q1", day, 2).allowed, true); // repetição não gasta
  assert.equal(consumeDaily(uses, "q3", day, 2).allowed, false);
  assert.equal(consumeDaily(uses, "q3", "2026-11-18", 2).allowed, true); // novo dia
});
