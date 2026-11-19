import Link from "next/link";
import { hasAdminPermission } from "../lib/admin-permissions";
import { dailySeries, listStudents, overview, type DaySeries } from "../lib/admin/students";
import { adminOrders, type OrderView } from "../lib/pix/store";
import { onboardingStats } from "../lib/admin/onboarding";
import { features } from "../lib/features";

const brl = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
const tierLabel = { gratis: "Grátis", essencial: "Essencial", premium: "Premium" } as const;
const sourceLabel: Record<string, string> = { email: "E-mail", google: "Google", legado: "Legado" };
const statusLabel: Record<string, string> = { aguardando_pix: "Aguardando", em_conferencia: "Em análise", pago: "Pago", expirado: "Expirado", cancelado: "Cancelado", reembolsado: "Reembolsado" };
const dayShort = (iso: string) => { const [, m, d] = iso.split("-"); return `${d}/${m}`; };
const weekday = (iso: string) => new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`)).replace(".", "");
const dateBr = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");

function Chart({ series }: { series: DaySeries }) {
  const w = 560, h = 190, pad = { l: 34, r: 12, t: 12, b: 28 };
  const max = Math.max(5, ...series.flatMap((d) => [d.signups, d.active]));
  const top = Math.ceil(max / 5) * 5;
  const x = (i: number) => pad.l + (i * (w - pad.l - pad.r)) / Math.max(1, series.length - 1);
  const y = (v: number) => pad.t + (1 - v / top) * (h - pad.t - pad.b);
  const path = (pick: (d: DaySeries[number]) => number) => series.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(pick(d)).toFixed(1)}`).join(" ");
  return (
    <figure className="ah-chart">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Cadastros e alunos ativos por dia, últimos 7 dias. Os valores estão na tabela abaixo.">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (<g key={f}><line x1={pad.l} x2={w - pad.r} y1={y(top * f)} y2={y(top * f)} className="ah-grid" /><text x={pad.l - 6} y={y(top * f) + 4} textAnchor="end" className="ah-axis">{Math.round(top * f)}</text></g>))}
        {series.map((d, i) => (<text key={d.day} x={x(i)} y={h - 8} textAnchor="middle" className="ah-axis">{weekday(d.day)}</text>))}
        <path d={path((d) => d.signups)} className="ah-line ah-line-a" />
        <path d={path((d) => d.active)} className="ah-line ah-line-b" />
        {series.map((d, i) => (<g key={d.day}><circle cx={x(i)} cy={y(d.signups)} r="3.5" className="ah-dot-a" /><circle cx={x(i)} cy={y(d.active)} r="3.5" className="ah-dot-b" /></g>))}
      </svg>
      <figcaption className="ah-legend"><span><i className="ah-key-a" />Cadastros</span><span><i className="ah-key-b" />Alunos ativos</span></figcaption>
      <details className="ah-table"><summary>Ver valores por dia</summary>
        <table><thead><tr><th scope="col">Dia</th><th scope="col">Cadastros</th><th scope="col">Alunos ativos</th></tr></thead><tbody>{series.map((d) => (<tr key={d.day}><th scope="row">{dayShort(d.day)}</th><td>{d.signups}</td><td>{d.active}</td></tr>))}</tbody></table>
      </details>
    </figure>
  );
}

/** Visão geral operacional (anexo 5): indicadores, gráfico, fila Pix e cadastros recentes. Cada bloco falha sozinho, com mensagem, sem derrubar a página. */
export default async function AdminHome({ role }: { role: unknown }) {
  const can = hasAdminPermission(role, "students.read");
  // Pix e receita seguem a mesma permissão da aba Pagamentos Pix (payments.read), não a de alunos.
  const canPay = hasAdminPermission(role, "payments.read");
  const [ov, series, queue, recent, onb] = await Promise.all([
    can ? overview().catch(() => null) : null,
    can ? dailySeries(7).catch(() => null) : null,
    canPay ? adminOrders({ status: "em_conferencia" }).catch(() => null) : null,
    can ? listStudents({ page: 1 }).catch(() => null) : null,
    can && features.onboarding ? onboardingStats() : null,
  ]);
  const metrics: [string, string, string][] = ov ? [
    ["Novos cadastros", String(ov.signups7), "Contas de aluno criadas nos últimos 7 dias"],
    ["Alunos que estudaram", String(ov.active7), "Com atividade pedagógica nos últimos 7 dias"],
  ] : [];
  if (ov && canPay) metrics.push(["Pix a conferir", String(ov.toReview), "Avisos de pagamento aguardando conciliação bancária"], ["Receita confirmada", brl(ov.revenue30Cents), "Pix confirmados nos últimos 30 dias, sem devoluções"]);
  const orders: OrderView[] = queue?.rows.slice(0, 5) ?? [];
  return (
    <div className="ah">
      <div className="ah-period"><span>Últimos 7 dias</span>{canPay ? <small>Receita: 30 dias</small> : null}</div>
      {ov ? (
        <ul className="ah-metrics" aria-label="Indicadores">
          {metrics.map(([title, value, text]) => (<li key={title}><span>{title}</span><strong>{value}</strong><small>{text}</small></li>))}
        </ul>
      ) : <p role="alert" className="status-message">{can ? "Não foi possível carregar os indicadores agora." : "Você não tem permissão para ver os indicadores de alunos."}</p>}
      {can && features.onboarding ? (
        <section className="ah-card" aria-labelledby="ah-onb-t">
          <h2 id="ah-onb-t">Onboarding (30 dias)</h2>
          {onb ? (onb.started ? <p className="ah-sub">{onb.started} iniciaram · {onb.completed} concluíram ({Math.round((onb.completed / onb.started) * 100)}%) · parados na etapa 1: {onb.stoppedAt[1]}, etapa 2: {onb.stoppedAt[2]}, etapa 3: {onb.stoppedAt[3]}. Contagens, sem respostas pessoais.</p> : <p className="ah-sub">Sem dados: ninguém iniciou o onboarding ainda.</p>) : <p className="status-message">Métricas de onboarding indisponíveis agora.</p>}
        </section>
      ) : null}
      <div className="ah-row">
        <section className="ah-card" aria-labelledby="ah-chart-t">
          <h2 id="ah-chart-t">Cadastros e atividade</h2>
          {series ? <Chart series={series} /> : <p className="status-message">Sem dados de série agora.</p>}
        </section>
        {canPay ? <section className="ah-card" aria-labelledby="ah-pix-t">
          <h2 id="ah-pix-t">Pagamentos Pix</h2>
          <p className="ah-sub">Liberação só depois da conferência bancária. O aviso do aluno não é crédito.</p>
          {queue ? (orders.length ? (
            <ul className="ah-pix">{orders.map((o) => (
              <li key={o.id}>
                <span className="ah-code">GD-{o.id.slice(0, 4).toUpperCase()}</span>
                <span>{o.tier === "premium" ? "Premium" : "Essencial"}</span>
                <b>{brl(o.expectedCents)}</b>
                <em className={`ah-badge ah-badge-${o.status}`}>{statusLabel[o.status] ?? o.status}</em>
                <Link className="ah-link" href={`/admin?tab=pix&status=em_conferencia&q=${o.id.slice(0, 8)}`} aria-label={`Conferir pedido ${o.id.slice(0, 8)}`}>Conferir ›</Link>
              </li>
            ))}</ul>
          ) : <p className="ah-empty">Nenhum pagamento aguardando conferência.</p>) : <p className="status-message" role="status">Fila Pix indisponível agora (não é fila vazia). Confirme se a migração 06 foi aplicada e abra <Link className="ah-link" href="/admin?tab=pix">Pagamentos Pix</Link> para o diagnóstico.</p>}
          <p><Link className="ah-link" href="/admin?tab=pix">Abrir todos os pagamentos</Link></p>
        </section> : null}
      </div>
      <section className="ah-card" aria-labelledby="ah-recent-t">
        <div className="ah-card-head"><h2 id="ah-recent-t">Cadastros recentes</h2><Link className="ah-link" href="/admin?tab=cadastros">Ver todos ›</Link></div>
        {recent ? (recent.rows.length ? (
          <div className="table-wrap" tabIndex={0} role="region" aria-label="Cadastros recentes">
            <table className="ah-recent">
              <thead><tr><th scope="col">Aluno</th><th scope="col">Cadastro</th><th scope="col">Plano</th><th scope="col">Último estudo</th><th scope="col">Situação</th><th scope="col"><span className="sr-only">Detalhe</span></th></tr></thead>
              <tbody>{recent.rows.slice(0, 5).map((r) => (
                <tr key={r.id}>
                  <th scope="row"><span className="ah-avatar" aria-hidden="true">{(r.name || r.email).slice(0, 1).toUpperCase()}</span>{r.name || "(sem nome)"}<small>{r.email}</small></th>
                  <td>{sourceLabel[r.source] ?? r.source}</td>
                  <td><em className={`ah-plan ah-plan-${r.tier}`}>{tierLabel[r.tier]}</em></td>
                  <td>{r.freq.hasData ? dateBr(r.freq.lastStudyDay ? `${r.freq.lastStudyDay}T12:00:00Z` : null) : "sem atividade"}</td>
                  <td><em className={`ah-state ${r.status === "suspended" ? "is-bad" : r.verified ? "is-ok" : "is-wait"}`}>{r.status === "suspended" ? "Suspensa" : r.verified ? "Ativo" : "E-mail pendente"}</em></td>
                  <td><Link className="ah-link" href={`/admin?tab=cadastros&id=${r.id}`} aria-label={`Abrir ${r.name || r.email}`}>Abrir ›</Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="ah-empty">Ainda não há cadastros.</p>) : <p className="status-message">Lista de cadastros indisponível agora.</p>}
      </section>
    </div>
  );
}
