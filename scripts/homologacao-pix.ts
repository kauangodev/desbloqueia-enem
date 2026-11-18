/**
 * Homologação do fluxo Grátis + Pix contra um MySQL/MariaDB DE TESTE, com dados sintéticos (prefixo "hml-").
 *
 * Uso (PowerShell, na pasta do projeto):
 *   $env:HOSTINGER_MYSQL_HOST="..."; $env:HOSTINGER_MYSQL_DATABASE="godev_homolog"; $env:HOSTINGER_MYSQL_USER="..."; $env:HOSTINGER_MYSQL_PASSWORD="..."
 *   $env:SESSION_SECRET="qualquer-segredo-de-teste-com-32-caracteres-ou-mais"
 *   $env:HOMOLOG_CONFIRM="sim"
 *   node --require ./scripts/preload-server-only.cjs --import tsx scripts/homologacao-pix.ts
 *
 * Segurança: recusa rodar se o nome do banco não contiver "test", "homolog" ou "staging", ou sem HOMOLOG_CONFIRM=sim. Ofertas que
 * estavam ativas são restauradas no fim e tudo o que o script cria é apagado. NUNCA aponte para o banco de produção.
 */
import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2/promise";
import { mysqlPool } from "../lib/mysql";
import { crc16 } from "../lib/pix/payload";
import { rightsFor } from "../lib/planos/model";
import { activateOffer, adminOrders, confirmOrder, createOrder, notifyOrder, orderForUser, refundOrder, saveOfferDraft, listOffers } from "../lib/pix/store";
import { listStudents, overview, studentDetail } from "../lib/admin/students";

const database = process.env.HOSTINGER_MYSQL_DATABASE || process.env.DB_NAME || "";
if (process.env.HOMOLOG_CONFIRM !== "sim" || !/test|homolog|staging/i.test(database)) {
  console.error(`Recusado. Defina HOMOLOG_CONFIRM=sim e use um banco cujo nome contenha test, homolog ou staging (atual: "${database || "não definido"}").`);
  process.exit(2);
}

const results: { name: string; ok: boolean; detail?: string }[] = [];
const check = (name: string, ok: boolean, detail?: string) => { results.push({ name, ok, detail }); console.log(`${ok ? "OK  " : "FALHA"} ${name}${detail ? ` — ${detail}` : ""}`); };
const tl = (id: string, value: string) => `${id}${String(value.length).padStart(2, "0")}${value}`;
/** Pix Copia e Cola SINTÉTICO (chave e recebedor fictícios). */
function syntheticPix(cents: number, receiver: string) {
  const body = tl("00", "01") + tl("01", "11") + tl("26", tl("00", "br.gov.bcb.pix") + tl("01", "hml@exemplo.invalid")) + tl("52", "0000") + tl("53", "986") + tl("54", (cents / 100).toFixed(2)) + tl("58", "BR") + tl("59", receiver) + tl("60", "SAO PAULO") + tl("62", tl("05", "***")) + "6304";
  return body + crc16(body);
}

const RECEIVER = "HML TESTE";
const tag = randomUUID().slice(0, 8);
const pool = () => mysqlPool();
const q = async <T extends RowDataPacket>(sql: string, args: unknown[] = []) => (await pool().query<T[]>(sql, args))[0];

async function main() {
  // 0) Migração aplicada?
  const need = ["pix_offers", "pix_orders", "pix_order_events", "auth_identities"];
  const tables = (await q("SELECT table_name AS t FROM information_schema.tables WHERE table_schema = DATABASE()")).map((r) => String(r.t).toLowerCase());
  check("migração 06: tabelas novas existem", need.every((t) => tables.includes(t)), need.filter((t) => !tables.includes(t)).join(", ") || undefined);
  const cols = (await q("SELECT column_name AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users'")).map((r) => String(r.c).toLowerCase());
  const wantCols = ["signup_source", "terms_version", "terms_accepted_at", "marketing_optin", "last_login_at"];
  check("migração 06: colunas novas em users", wantCols.every((c) => cols.includes(c)), wantCols.filter((c) => !cols.includes(c)).join(", ") || undefined);
  if (results.some((r) => !r.ok)) throw new Error("Aplique a migração 06 antes de continuar.");

  // 1) Usuários sintéticos
  const alice = randomUUID(); const bob = randomUUID();
  for (const [id, who] of [[alice, "alice"], [bob, "bob"]]) await pool().query("INSERT INTO users (id,email,name,role,email_verified_at,signup_source) VALUES (?,?,?,'student',CURRENT_TIMESTAMP(3),'email')", [id, `hml-${tag}-${who}@example.invalid`, `HML ${who}`]);
  const wasActive = await q("SELECT code FROM pix_offers WHERE status = 'ativa'");

  // 2) Ofertas: rascunho não vende; código inválido não ativa; código bom ativa
  const draft = await saveOfferDraft(alice, { tier: "essencial", cents: 1090, receiverName: RECEIVER, copyPaste: null, reviewMinutes: 1440 });
  check("oferta sem código: rascunho criado e NÃO ativável", !(await activateOffer(alice, draft)).ok);
  check("rascunho não permite criar pedido", !(await createOrder(alice, "essencial")).ok || wasActive.length > 0);
  const bad = await saveOfferDraft(alice, { tier: "essencial", cents: 1090, receiverName: RECEIVER, copyPaste: syntheticPix(9999, RECEIVER), reviewMinutes: 1440 });
  check("código com valor diferente não ativa", !(await activateOffer(alice, bad)).ok);
  const good = await saveOfferDraft(alice, { tier: "essencial", cents: 1090, receiverName: RECEIVER, copyPaste: syntheticPix(1090, RECEIVER), reviewMinutes: 1440 });
  check("código válido ativa a oferta", (await activateOffer(alice, good)).ok);
  const premium = await saveOfferDraft(alice, { tier: "premium", cents: 1990, receiverName: RECEIVER, copyPaste: syntheticPix(1990, RECEIVER), reviewMinutes: 1440 });
  await activateOffer(alice, premium);
  const newer = await saveOfferDraft(alice, { tier: "essencial", cents: 1290, receiverName: RECEIVER, copyPaste: syntheticPix(1290, RECEIVER), reviewMinutes: 1440 });
  const offers = await listOffers();
  check("rascunho mais novo aparece primeiro e a oferta ativa continua ativa", offers.find((o) => o.tier === "essencial")?.code === newer && offers.find((o) => o.code === good)?.status === "ativa");

  // 3) Pedido: clique duplo/concorrente cria UM pedido
  const parallel = await Promise.all(Array.from({ length: 6 }, () => createOrder(alice, "essencial")));
  const ids = new Set(parallel.filter((r) => r.ok).map((r) => (r as { id: string }).id));
  check("6 pedidos simultâneos do mesmo aluno → 1 pedido", ids.size === 1, `${ids.size} pedido(s)`);
  const orderId = [...ids][0];
  const order = await orderForUser(alice, orderId);
  check("pedido nasce aguardando e com o preço da oferta (R$ 10,90)", order?.status === "aguardando_pix" && order.expectedCents === 1090);
  check("outro aluno não enxerga o pedido", (await orderForUser(bob, orderId)) === null);

  // 4) Aviso do aluno (idempotente) não libera acesso
  const n1 = await notifyOrder(alice, orderId); const n2 = await notifyOrder(alice, orderId);
  check("'Já fiz o Pix' é idempotente", n1.ok && n2.ok && (n1 as { status: string }).status === "em_conferencia");
  const ent0 = await q("SELECT active FROM entitlements WHERE order_id = ?", [`pix:${orderId}`]);
  check("aviso do aluno NÃO concede direito", ent0.length === 0);

  // 5) Conferência: recebedor errado, valor errado, ok
  const ref = `E${tag}${Date.now()}`.slice(0, 32).padEnd(12, "0");
  const ev = { bankRef: ref, amountCents: 1090, receivedAt: new Date().toISOString(), receiver: RECEIVER };
  check("recebedor diferente é recusado", !(await confirmOrder(alice, orderId, { ...ev, receiver: "OUTRA PESSOA" })).ok);
  check("valor diferente é recusado", !(await confirmOrder(alice, orderId, { ...ev, amountCents: 1000 })).ok);
  check("data futura é recusada", !(await confirmOrder(alice, orderId, { ...ev, receivedAt: new Date(Date.now() + 86_400_000).toISOString() })).ok);
  const both = await Promise.all([confirmOrder(alice, orderId, ev), confirmOrder(alice, orderId, ev)]);
  check("duas confirmações simultâneas → uma muda, outra devolve o estado", both.every((r) => r.ok) && both.filter((r) => r.ok && (r as { changed: boolean }).changed).length === 1);
  const ent1 = await q("SELECT active, user_id, plan FROM entitlements WHERE order_id = ?", [`pix:${orderId}`]);
  check("confirmação concede direito ao aluno certo (essencial, ativo)", ent1.length === 1 && Boolean(ent1[0].active) && ent1[0].user_id === alice && ent1[0].plan === "essencial");
  check("direitos: Alice passa de Grátis a Essencial; Bob continua Grátis", rightsFor((await q("SELECT order_id, plan, active FROM entitlements WHERE user_id = ?", [alice])).map((e) => ({ orderId: e.order_id, plan: e.plan, active: Boolean(e.active) })), true)?.tier === "essencial"
    && rightsFor((await q("SELECT order_id, plan, active FROM entitlements WHERE user_id = ?", [bob])).map((e) => ({ orderId: e.order_id, plan: e.plan, active: Boolean(e.active) })), true)?.tier === "gratis");

  // 6) A mesma referência bancária não confirma outro pedido
  const orderB = await createOrder(bob, "premium");
  check("pedido do Bob criado", orderB.ok);
  if (orderB.ok) {
    const reuse = await confirmOrder(alice, orderB.id, { bankRef: ref, amountCents: 1990, receivedAt: new Date().toISOString(), receiver: RECEIVER });
    check("mesma referência bancária em outro pedido é recusada", !reuse.ok);
  }

  // 7) CRM
  const list = await listStudents({ q: `hml-${tag}`, page: 1 });
  check("CRM lista os alunos sintéticos (inclui quem não comprou)", list.rows.length === 2 && list.rows.some((r) => r.tier === "essencial") && list.rows.some((r) => r.tier === "gratis"));
  const detail = await studentDetail(alice);
  check("detalhe do aluno traz o pedido Pix e o direito", Boolean(detail && detail.orders.length >= 1 && detail.entitlements.some((e) => e.orderId === `pix:${orderId}`)));
  const ov = await overview();
  check("indicadores carregam", ov.signups30 >= 2 && ov.upgrades30 >= 1, `cadastros30=${ov.signups30} upgrades30=${ov.upgrades30}`);
  const queue = await adminOrders({ status: "pago", q: tag });
  check("fila filtra por status e busca", queue.total >= 1);

  // 8) Reembolso revoga só o direito deste pedido
  const refund = await refundOrder(alice, orderId, `D${tag}${Date.now()}`.slice(0, 32).padEnd(12, "0"));
  const ent2 = await q("SELECT active FROM entitlements WHERE order_id = ?", [`pix:${orderId}`]);
  check("reembolso revoga o direito do pedido", refund.ok && ent2.length === 1 && !ent2[0].active);

  // 9) Limpeza e restauração
  const orderIds = (await q("SELECT id FROM pix_orders WHERE user_id IN (?, ?)", [alice, bob])).map((r) => r.id);
  if (orderIds.length) {
    await pool().query("DELETE FROM pix_order_events WHERE order_id IN (?)", [orderIds]);
    await pool().query("DELETE FROM entitlements WHERE order_id IN (?)", [orderIds.map((id) => `pix:${id}`)]);
    await pool().query("DELETE FROM pix_orders WHERE id IN (?)", [orderIds]);
  }
  await pool().query("DELETE FROM pix_offers WHERE receiver_name = ?", [RECEIVER]);
  await pool().query("DELETE FROM audit_logs WHERE actor IN (?, ?)", [alice, bob]);
  await pool().query("DELETE FROM users WHERE id IN (?, ?)", [alice, bob]);
  for (const r of wasActive) await pool().query("UPDATE pix_offers SET status = 'ativa' WHERE code = ? AND status = 'encerrada'", [r.code]);
  check("limpeza concluída (usuários, pedidos, ofertas de teste apagados; ofertas anteriores restauradas)", true);
}

main()
  .catch((error) => { check("execução sem erro", false, error instanceof Error ? error.message : String(error)); })
  .finally(async () => {
    const failed = results.filter((r) => !r.ok);
    console.log(`\n${results.length - failed.length}/${results.length} verificações OK`);
    if (failed.length) console.log("Falhas:\n" + failed.map((f) => ` - ${f.name}${f.detail ? ` (${f.detail})` : ""}`).join("\n"));
    await pool().end().catch(() => undefined);
    process.exit(failed.length ? 1 : 0);
  });
