import Link from "next/link";
import { hasAdminPermission } from "../lib/admin-permissions";
import { listStudents, overview, studentDetail, type StudentFilter } from "../lib/admin/students";
import { funnelSummary } from "../lib/admin/funnel";

const tierLabel = { gratis: "Grátis", essencial: "Essencial", premium: "Premium" } as const;
const sourceLabel: Record<string, string> = { email: "E-mail", google: "Google", legado: "Legado (compra)" };
const orderStatus: Record<string, string> = { aguardando_pix: "Aguardando Pix", em_conferencia: "Em conferência", pago: "Pago", expirado: "Expirado", cancelado: "Cancelado", reembolsado: "Reembolsado" };
const brl = (c: number) => `R$ ${(c / 100).toFixed(2).replace(".", ",")}`;
const dateBr = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");
const pct = (r: { numerator: number; denominator: number; pct: number | null }) => (r.pct === null ? "sem dados" : `${r.pct}% (${r.numerator}/${r.denominator})`);
const dayBr = (day: string | null) => (day ? day.split("-").reverse().join("/") : "—");

/** "Alunos e cadastros": indicadores com definição, lista paginada (inclui quem nunca comprou) e detalhe do aluno. */
export default async function AdminStudentsSection({ role, filter, detailId }: { role: unknown; filter: StudentFilter; detailId?: string }) {
  if (!hasAdminPermission(role, "students.read")) return <p role="alert">Você não tem permissão para ver alunos.</p>;
  if (detailId) {
    const d = await studentDetail(detailId).catch(() => null);
    if (!d) return <p role="alert">Aluno não encontrado. <Link className="op-link" href="/admin?tab=cadastros">Voltar à lista</Link></p>;
    return (
      <div className="op-stack">
        <p><Link className="op-link" href="/admin?tab=cadastros">← Alunos e cadastros</Link></p>
        <section className="admin-card" style={{ padding: 16 }} aria-labelledby="sd-h">
          <h2 id="sd-h">{d.name || "(sem nome)"}</h2>
          <p>{d.email} · {d.verified ? "e-mail verificado" : "cadastro pendente de confirmação"} · conta {d.status === "suspended" ? "suspensa" : "ativa"}</p>
          <p>Plano: <strong>{tierLabel[d.tier]}</strong> · origem {sourceLabel[d.source] ?? d.source}{d.identities.length ? ` · Google vinculado` : ""} · cadastro em {dateBr(d.createdAt)}</p>
          <p>Último login: {dateBr(d.lastLoginAt)} (uso) · Último estudo: {dayBr(d.freq.lastStudyDay)} (atividade pedagógica)</p>
        </section>
        <section className="admin-card" style={{ padding: 16 }} aria-labelledby="sf-h">
          <h3 id="sf-h">Frequência de estudo</h3>
          {d.freq.hasData ? <p>{d.freq.active7} dia(s) ativo(s) nos últimos 7 · {d.freq.active30} nos últimos 30 · sequência atual {d.freq.streak} · {d.freq.totalDays} no total</p> : <p>Sem atividade de estudo registrada.</p>}
          {d.byDay.length ? <p><small>Últimos dias ativos: {d.byDay.map((x) => dayBr(x.day)).join(", ")}</small></p> : null}
        </section>
        <section className="admin-card" style={{ padding: 16 }} aria-labelledby="sp-h">
          <h3 id="sp-h">Pedidos Pix e direitos</h3>
          {d.orders.length ? <ul>{d.orders.map((o) => <li key={o.id}>{o.tier === "premium" ? "Premium" : "Essencial"} · {brl(o.cents)} · {orderStatus[o.status] ?? o.status} · {dateBr(o.createdAt)} · {o.id.slice(0, 8)}</li>)}</ul> : <p>Nenhum pedido Pix.</p>}
          {d.entitlements.length ? <p><small>Direitos: {d.entitlements.map((e) => `${e.plan} (${e.active ? "ativo" : "revogado"}, ${e.orderId.slice(0, 12)})`).join("; ")}</small></p> : <p><small>Sem direitos pagos: usa o plano Grátis.</small></p>}
        </section>
      </div>
    );
  }
  let failed = false;
  const funnel = await funnelSummary();
  let ov: Awaited<ReturnType<typeof overview>> | null = null;
  let list: Awaited<ReturnType<typeof listStudents>> | null = null;
  try { [ov, list] = await Promise.all([overview(), listStudents(filter)]); } catch { failed = true; }
  const qs = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams({ tab: "cadastros" });
    const base: Record<string, string | number | undefined> = { q: filter.q, plan: filter.plan, source: filter.source, activity: filter.activity, ...over };
    for (const [k, v] of Object.entries(base)) if (v !== undefined && v !== "" && !(k === "page" && Number(v) <= 1)) p.set(k, String(v));
    return `/admin?${p.toString()}`;
  };
  const pages = list ? Math.max(1, Math.ceil(list.total / list.pageSize)) : 1;
  return (
    <div className="op-stack">
      {failed ? <p role="alert" className="status-message error">Não foi possível carregar os dados agora. Tente recarregar.</p> : null}
      {ov ? (
        <section aria-labelledby="ov-h">
          <h2 id="ov-h">Indicadores (últimos 30 dias, salvo indicação)</h2>
          <dl className="as-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
            {([
              ["Cadastros", `${ov.signups7} em 7 d · ${ov.signups30} em 30 d`, "Contas de aluno criadas, verificadas ou não."],
              ["Verificados", String(ov.verified30), `${ov.pending30} ainda pendentes de confirmação (não acessam o estudo).`],
              ["Fizeram a 1ª atividade", String(ov.firstActivity30), "Entre os cadastrados do período: pelo menos 1 resposta, módulo ou treino."],
              ["Ativos 7 d / 30 d", `${ov.active7} / ${ov.active30}`, "Com atividade pedagógica registrada na janela (login não conta)."],
              ["Upgrades confirmados", String(ov.upgrades30), "Pedidos Pix confirmados por operador no período."],
              ["Receita Pix confirmada", brl(ov.revenue30Cents), "Soma dos valores esperados dos pedidos confirmados (sem devoluções)."],
              ["Pagamentos a conferir", String(ov.toReview), "Pedidos com aviso do aluno, aguardando o operador."],
              ["Conversão Grátis → pago", ov.conversion30.rate === null ? "—" : `${ov.conversion30.rate}%`, `Coorte: ${ov.conversion30.total} verificados nos últimos 30 d; ${ov.conversion30.paid} com 1ª compra Pix confirmada.`],
            ] as const).map(([t, v, d]) => <div key={t} className="admin-card" style={{ padding: 12 }}><dt>{t}</dt><dd style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700 }}>{v}</dd><dd style={{ margin: 0 }}><small>{d}</small></dd></div>)}
          </dl>
          <p><small>Origem dos cadastros (30 d): {Object.entries(ov.bySource30).map(([k, n]) => `${sourceLabel[k] ?? k} ${n}`).join(" · ") || "sem cadastros"}.{!ov.migrated ? " A migração 06 ainda não foi aplicada: origem, último login e pedidos Pix aparecem como legado/zero." : ""}</small></p>
        </section>
      ) : null}
      <section aria-labelledby="fn-h">
        <h2 id="fn-h">Funil da landing (30 dias)</h2>
        {funnel ? (
          <>
            <ul>
              <li>Visita → demonstração: <strong>{pct(funnel.rates.visitaParaDemo)}</strong> <small>(visitantes que consentiram)</small></li>
              <li>Visita → cadastro verificado: <strong>{pct(funnel.rates.visitaParaCadastroVerificado)}</strong> <small>(contas verificadas ÷ visitantes que consentiram)</small></li>
              <li>Cadastro verificado → primeiro estudo: <strong>{pct(funnel.rates.cadastroParaPrimeiroEstudo)}</strong> <small>(contas)</small></li>
              <li>Checkout iniciado → pagamento confirmado: <strong>{pct(funnel.rates.checkoutParaPagamento)}</strong> <small>(pedidos; considera o atraso da conferência manual)</small></li>
              <li>Visita → pagamento confirmado: <strong>{pct(funnel.rates.visitaParaPagamento)}</strong></li>
            </ul>
            <p><small>Visitantes: {funnel.counts.visitors} · planos vistos: {funnel.counts.planViewers} · cadastros verificados: {funnel.counts.signupsVerified} · primeiro estudo: {funnel.counts.firstStudy} · checkouts: {funnel.counts.checkouts} · compras confirmadas: {funnel.counts.purchases}. A venda é só o pagamento confirmado; abrir o QR e “Já fiz o Pix” não contam. Sem visitantes registrados, a taxa aparece como “sem dados”.</small></p>
          </>
        ) : <p>Sem dados: a migração 07 (funil) ainda não foi aplicada.</p>}
      </section>
      <form action="/admin" method="get" role="search" aria-label="Filtrar alunos">
        <input type="hidden" name="tab" value="cadastros" />
        <label className="field">Buscar por nome ou e-mail<input name="q" defaultValue={filter.q} maxLength={80} /></label>
        <label className="field">Plano<select name="plan" defaultValue={filter.plan || ""}><option value="">Todos</option><option value="gratis">Grátis</option><option value="essencial">Essencial</option><option value="premium">Premium</option></select></label>
        <label className="field">Origem<select name="source" defaultValue={filter.source || ""}><option value="">Todas</option><option value="email">E-mail</option><option value="google">Google</option><option value="legado">Legado (compra)</option></select></label>
        <label className="field">Atividade<select name="activity" defaultValue={filter.activity || ""}><option value="">Todas</option><option value="7">Ativos nos últimos 7 dias</option><option value="30">Ativos nos últimos 30 dias</option><option value="nunca">Nunca estudaram</option></select></label>
        <button className="button secondary">Filtrar</button>
      </form>
      {list ? (
        list.rows.length ? (
          <div className="table-wrap" tabIndex={0} role="region" aria-label="Lista de alunos">
            <table className="crm-table">
              <thead><tr><th scope="col">Aluno</th><th scope="col">Origem</th><th scope="col">Plano</th><th scope="col">Cadastro</th><th scope="col">Último login</th><th scope="col">Último estudo</th><th scope="col">Dias ativos 7/30</th><th scope="col">Estado</th></tr></thead>
              <tbody>
                {list.rows.map((r) => (
                  <tr key={r.id}>
                    <th scope="row"><Link className="op-link" href={`/admin?tab=cadastros&id=${r.id}`}>{r.name || "(sem nome)"}</Link><br /><small>{r.email}</small></th>
                    <td>{sourceLabel[r.source] ?? r.source}</td><td>{tierLabel[r.tier]}</td><td>{dateBr(r.createdAt)}</td><td>{dateBr(r.lastLoginAt)}</td>
                    <td>{r.freq.hasData ? dayBr(r.freq.lastStudyDay) : "sem atividade"}</td>
                    <td>{r.freq.hasData ? `${r.freq.active7} / ${r.freq.active30}` : "—"}</td>
                    <td>{r.status === "suspended" ? "Suspensa" : r.verified ? "Verificada" : "Pendente"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p>Nenhum aluno neste filtro.</p>
      ) : null}
      {list && pages > 1 ? <p>Página {list.page} de {pages} ({list.total} alunos) · {list.page > 1 ? <Link className="op-link" href={qs({ page: list.page - 1 })}>Anterior</Link> : null} {list.page < pages ? <Link className="op-link" href={qs({ page: list.page + 1 })}>Próxima</Link> : null}</p> : null}
      {list && !list.migrated ? <p><small>Origem e último login dependem da migração 06.</small></p> : null}
      <p><small>O filtro de atividade usa a data de gravação do estudo (aproximada); os dias ativos exibidos por aluno são calculados dos eventos reais.</small></p>
    </div>
  );
}
