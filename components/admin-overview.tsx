import Link from "next/link";
import { money } from "../lib/config";

type AdminStat = { table: string; count: number | null };
type OverviewOrder = {
  id: string;
  email: string;
  name: string;
  plan: string;
  amount: number;
  status: string;
  created_at: string;
};

const statValue = (stats: AdminStat[], table: string) =>
  stats.find((item) => item.table === table)?.count ?? 0;

const orderLabel: Record<string, string> = {
  paid: "Pagamento aprovado",
  pending: "Pagamento pendente",
  refused: "Pagamento recusado",
  refunded: "Reembolso confirmado",
  chargedback: "Chargeback registrado",
};

const orderTone: Record<string, string> = {
  paid: "is-success",
  pending: "is-warning",
  refused: "is-danger",
  refunded: "is-muted",
  chargedback: "is-danger",
};

export default function AdminOverview({
  stats,
  orders,
  adSpendCents = 0,
}: {
  stats: AdminStat[];
  orders: OverviewOrder[];
  adSpendCents?: number;
}) {
  const paidOrders = orders.filter((order) => order.status === "paid");
  const revenue = paidOrders.reduce(
    (total, order) => total + Math.round(Number(order.amount || 0) * 100),
    0,
  );
  const refunds = orders.filter(
    (order) => order.status === "refunded" || order.status === "chargedback",
  ).length;
  const pending = orders.filter((order) => order.status === "pending").length;
  const premiumOrders = paidOrders.filter((order) => order.plan === "premium").length;
  const essentialOrders = paidOrders.filter((order) => order.plan === "essencial").length;
  const maxDay = Math.max(
    1,
    ...Array.from({ length: 7 }, (_, index) => {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - (6 - index));
      return paidOrders
        .filter((order) => {
          const created = new Date(order.created_at);
          return created >= day && created < new Date(day.getTime() + 86400000);
        })
        .reduce((total, order) => total + Math.round(Number(order.amount || 0) * 100), 0);
    }),
  );
  const chartDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    const value = paidOrders
      .filter((order) => {
        const created = new Date(order.created_at);
        return created >= day && created < new Date(day.getTime() + 86400000);
      })
      .reduce((total, order) => total + Math.round(Number(order.amount || 0) * 100), 0);
    return {
      label: new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(day).replace(".", ""),
      value,
      height: Math.max(8, Math.round((value / maxDay) * 100)),
    };
  });
  const metrics = [
    { label: "Alunos ativos", value: statValue(stats, "entitlements"), tone: "violet", hint: "acessos válidos" },
    { label: "Vendas aprovadas", value: paidOrders.length, tone: "pink", hint: "pedidos confirmados" },
    { label: "Entregas concluídas", value: Math.max(0, statValue(stats, "entitlements") - statValue(stats, "email_deliveries")), tone: "mint", hint: "acessos provisionados" },
    { label: "Pendências", value: pending + statValue(stats, "email_deliveries"), tone: "amber", hint: "exigem atenção" },
  ];
  const recent = orders.slice(0, 6);
  const totalPlans = Math.max(1, premiumOrders + essentialOrders);
  const trackedAccesses = statValue(stats, "account_access_fingerprints");
  const roi = adSpendCents > 0 ? ((revenue - adSpendCents) / adSpendCents) * 100 : null;

  return (
    <section className="admin-overview" aria-labelledby="overview-title">
      <div className="overview-grid">
        <article className="overview-revenue-card">
          <div className="overview-card-topline">
            <div>
              <span className="admin-eyebrow">Dados registrados</span>
              <h2 id="overview-title">Bem-vindo ao painel GoDev Education</h2>
            </div>
            <span className="overview-period">Base atual</span>
          </div>
          <div className="overview-total">
            <strong>{money(revenue)}</strong>
            <span>Resumo operacional baseado nos pagamentos registrados</span>
          </div>
          <div className="overview-chart" aria-label="Receita bruta dos últimos sete dias">
            {chartDays.map((day) => (
              <div className="overview-chart-column" key={day.label}>
                <span className="overview-chart-bar" style={{ height: day.height + "%" }} title={money(day.value)} />
                <small>{day.label}</small>
              </div>
            ))}
          </div>
          <div className="overview-card-footer">
            <span><i className="status-dot success" /> {paidOrders.length} aprovadas</span>
            <span><i className="status-dot warning" /> {pending} pendentes</span>
            <span><i className="status-dot muted" /> {refunds} reembolsos/chargebacks</span>
          </div>
        </article>

        <aside className="overview-activity-card" aria-labelledby="activity-title">
          <div className="overview-side-heading">
            <div>
              <span className="admin-eyebrow">Acompanhamento</span>
              <h2 id="activity-title">Atividades recentes</h2>
            </div>
            <span className="activity-pulse" aria-label="Dados sincronizados"><i /></span>
          </div>
          <div className="activity-list">
            {recent.map((order) => (
              <Link className="activity-item" href="/admin?tab=alunos" key={order.id}>
                <span className={"activity-icon " + (orderTone[order.status] || "is-muted")} aria-hidden="true">
                  {order.status === "paid" ? "✓" : order.status === "pending" ? "…" : "!"}
                </span>
                <span className="activity-copy">
                  <strong>{orderLabel[order.status] || "Atualização de pedido"}</strong>
                  <small>{order.name || order.email} · {order.plan === "premium" ? "Premium" : "Essencial"}</small>
                </span>
                <span className="activity-amount">{money(Math.round(Number(order.amount || 0) * 100))}</span>
              </Link>
            ))}
            {!recent.length && <p className="admin-empty-state">Ainda não há movimentações registradas.</p>}
          </div>
          <Link className="overview-text-link" href="/admin?tab=alunos">Abrir CRM de alunos</Link>
        </aside>
      </div>

      <div className="admin-overview-metrics">
        {metrics.map((metric) => (
          <article className={"overview-metric " + metric.tone} key={metric.label}>
            <span className="overview-metric-icon" aria-hidden="true">↗</span>
            <div>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
              <small>{metric.hint}</small>
            </div>
          </article>
        ))}
        <article className="overview-metric overview-metric-tracking">
          <span className="overview-metric-icon" aria-hidden="true">◉</span>
          <div>
            <strong>{trackedAccesses}</strong>
            <span>Acessos registrados</span>
            <small>dispositivos com atividade identificada</small>
          </div>
        </article>
        <article className="overview-metric overview-metric-roi">
          <span className="overview-metric-icon" aria-hidden="true">%</span>
          <div>
            <strong>{roi === null ? "—" : `${roi.toFixed(1)}%`}</strong>
            <span>ROI de mídia</span>
            <small>{roi === null ? "Informe o investimento para calcular" : "receita líquida sobre investimento"}</small>
          </div>
        </article>
      </div>

      <div className="overview-lower-grid">
        <article className="overview-white-card">
          <div className="overview-white-heading">
            <div>
              <span className="admin-eyebrow">Distribuição comercial</span>
              <h2>Planos adquiridos</h2>
            </div>
            <span className="overview-count">{paidOrders.length} pedidos</span>
          </div>
          <div className="plan-distribution">
            <div className="plan-distribution-row">
              <div><span className="plan-dot premium" /> Premium <b>{premiumOrders}</b></div>
              <span>{Math.round((premiumOrders / totalPlans) * 100)}%</span>
            </div>
            <div className="distribution-track"><span className="premium" style={{ width: (premiumOrders / totalPlans) * 100 + "%" }} /></div>
            <div className="plan-distribution-row">
              <div><span className="plan-dot essential" /> Essencial <b>{essentialOrders}</b></div>
              <span>{Math.round((essentialOrders / totalPlans) * 100)}%</span>
            </div>
            <div className="distribution-track"><span className="essential" style={{ width: (essentialOrders / totalPlans) * 100 + "%" }} /></div>
          </div>
        </article>

        <article className="overview-white-card">
          <div className="overview-white-heading">
            <div>
              <span className="admin-eyebrow">Ações rápidas</span>
              <h2>Operação do dia</h2>
            </div>
          </div>
          <div className="overview-quick-actions">
            <Link href="/admin?tab=alunos"><strong>CRM de alunos</strong><span>Consultar contatos e atividade</span><b>→</b></Link>
            <Link href="/admin?tab=entregas"><strong>Entregas</strong><span>Revisar acessos e falhas</span><b>→</b></Link>
            <Link href="/admin?tab=tickets"><strong>Tickets</strong><span>Responder solicitações abertas</span><b>→</b></Link>
          </div>
        </article>
      </div>
    </section>
  );
}
