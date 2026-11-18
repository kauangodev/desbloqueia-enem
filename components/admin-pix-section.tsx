import Link from "next/link";
import { adminOrders, expireDue, listOffers, offerProblems } from "../lib/pix/store";
import { hasAdminPermission } from "../lib/admin-permissions";
import { OfferEditor, OrderRow, type PixOfferView } from "./admin-pix";

const statusLabel: Record<string, string> = { aguardando_pix: "Aguardando Pix", em_conferencia: "Em conferência", pago: "Pago", expirado: "Expirado", cancelado: "Cancelado", reembolsado: "Reembolsado" };
const filters = ["", "em_conferencia", "aguardando_pix", "expirado", "pago", "reembolsado"] as const;

/** Aba "Pagamentos Pix": fila por status (busca e paginação no servidor) e configuração das ofertas. */
export default async function AdminPixSection({ role, status, q, page }: { role: unknown; status?: string; q?: string; page?: number }) {
  const canRead = hasAdminPermission(role, "payments.read");
  if (!canRead) return <p role="alert">Você não tem permissão para ver pagamentos.</p>;
  const canReconcile = hasAdminPermission(role, "payments.reconcile");
  const canManage = hasAdminPermission(role, "billing.manage");
  let failed = false;
  let offers: Awaited<ReturnType<typeof listOffers>> = [];
  let orders: Awaited<ReturnType<typeof adminOrders>> = { rows: [], total: 0, page: 1, pageSize: 20 };
  try { await expireDue(); [offers, orders] = await Promise.all([listOffers(), adminOrders({ status, q, page })]); } catch { failed = true; }
  const view = (tier: "essencial" | "premium"): PixOfferView | null => {
    const o = offers.find((x) => x.tier === tier && x.status === "ativa") ?? offers.find((x) => x.tier === tier);
    return o ? { code: o.code, tier, version: o.version, cents: o.cents, status: o.status, receiverName: o.receiverName, hasCode: Boolean(o.copyPaste), reviewMinutes: o.reviewMinutes, problems: offerProblems(o) } : null;
  };
  const receiver = offers.find((o) => o.status === "ativa")?.receiverName ?? "";
  const href = (s: string, p = 1) => `/admin?tab=pix${s ? `&status=${s}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}${p > 1 ? `&page=${p}` : ""}`;
  const pages = Math.max(1, Math.ceil(orders.total / orders.pageSize));
  return (
    <div className="op-stack">
      <p className="status-message" role="note">Modo atual: QR do banco com <strong>conciliação manual</strong>. O acesso só é liberado quando um operador confirma o crédito no extrato da conta recebedora. Não há confirmação bancária automática.</p>
      {failed ? <p role="alert" className="status-message error">Não foi possível carregar os dados. Verifique se a migração 06 foi aplicada no banco.</p> : null}
      <h2>Ofertas</h2>
      <OfferEditor tier="essencial" current={view("essencial")} canManage={canManage} />
      <OfferEditor tier="premium" current={view("premium")} canManage={canManage} />
      <h2>Fila de pedidos ({orders.total})</h2>
      <nav aria-label="Filtro por status" className="as-periods">
        {filters.map((f) => <Link key={f || "todos"} className="as-btn" href={href(f)} aria-current={(status || "") === f ? "page" : undefined}>{f ? statusLabel[f] : "Todos"}</Link>)}
      </nav>
      <form action="/admin" method="get"><input type="hidden" name="tab" value="pix" />{status ? <input type="hidden" name="status" value={status} /> : null}
        <label className="field">Buscar por aluno, e-mail, pedido ou referência<input name="q" defaultValue={q} maxLength={80} /></label><button className="button secondary">Buscar</button></form>
      {orders.rows.length ? (
        <div className="table-wrap" tabIndex={0} role="region" aria-label="Pedidos Pix">
          <table className="crm-table">
            <thead><tr><th scope="col">Aluno</th><th scope="col">Plano</th><th scope="col">Estado</th><th scope="col">Criado</th><th scope="col">Ações</th></tr></thead>
            <tbody>
              {orders.rows.map((o) => <OrderRow key={o.id} receiver={receiver} canReconcile={canReconcile} order={{ id: o.id, student: o.name || "(sem nome)", email: o.email || "", tier: o.tier, cents: o.expectedCents, status: o.status, statusLabel: statusLabel[o.status] ?? o.status, createdAt: o.createdAt, notifiedAt: o.notifiedAt, bankRef: o.bankRef }} />)}
            </tbody>
          </table>
        </div>
      ) : <p>Nenhum pedido neste filtro.</p>}
      {pages > 1 ? <p>Página {orders.page} de {pages} · {orders.page > 1 ? <Link className="op-link" href={href(status || "", orders.page - 1)}>Anterior</Link> : null} {orders.page < pages ? <Link className="op-link" href={href(status || "", orders.page + 1)}>Próxima</Link> : null}</p> : null}
    </div>
  );
}
