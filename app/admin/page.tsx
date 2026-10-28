import { identity, serviceClient } from "../../lib/supabase";
import { redirect } from "next/navigation";
import AdminEditor from "../../components/admin-editor";
import Link from "next/link";
import { money } from "../../lib/config";
import { checkoutConfigured } from "../../lib/readiness";
import { mysqlConfigured } from "../../lib/mysql";
import TicketManager from "../../components/ticket-manager";
import AdminOverview from "../../components/admin-overview";
import TeamManager from "../../components/team-manager";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administração | GoDev Education",
  robots: { index: false, follow: false },
};
type CrmProfile = { id: string; name: string; email: string; role: string };
type CrmOrder = {
  id: string;
  email: string;
  name: string;
  plan: string;
  amount: number;
  status: string;
  created_at: string;
};
type CrmEntitlement = {
  order_id: string;
  user_id: string | null;
  email: string;
  plan: string;
  active: boolean;
};
type CrmDelivery = {
  order_id: string;
  email: string;
  status: string;
  last_error: string | null;
};
type CrmAttempt = {
  user_id: string;
  activity: string;
  collection_id: string | null;
  score: number;
  total: number;
  completed_at: string;
};
type CrmEssay = {
  user_id: string;
  status: string;
  score: number | null;
  created_at: string;
};
type CrmCustomer = {
  email: string;
  name: string;
  profile: CrmProfile | null;
  orders: CrmOrder[];
  entitlements: CrmEntitlement[];
  deliveries: CrmDelivery[];
  attempts: CrmAttempt[];
  essays: CrmEssay[];
};
const date = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(
        new Date(value),
      )
    : "—";
const orderStatus: Record<string, string> = {
  paid: "Pago",
  pending: "Pendente",
  refused: "Recusado",
  refunded: "Reembolsado",
  chargedback: "Chargeback",
};
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const who = await identity();
  if (!who) redirect("/entrar");
  if (who.user.must_change_password) redirect("/definir-senha?first=1");
  if (who.profile?.role !== "admin") redirect("/aluno");
  const { tab = "visao", q = "" } = await searchParams;
  const db = serviceClient();
  let content: React.ReactNode;
  if (tab === "produtos") {
    const [{ data: products }, { data: offers }] = await Promise.all([
      db.from("products").select("*"),
      db.from("offers").select("*"),
    ]);
    content = (
      <>
        <p className="status-message">Preços e benefícios editados aqui atualizam o site. Confira os mesmos valores na Cakto antes de ativar uma oferta; esta tela não altera o produto na plataforma de pagamentos.</p>
        {products?.map((p) => (
          <AdminEditor
            key={p.id}
            action="product"
            title={`Produto ${p.name}`}
            initial={p}
          />
        ))}
        {offers?.map((o) => (
          <AdminEditor
            key={o.plan}
            action="offer"
            title={`Checkout ${o.plan}`}
            initial={o}
          />
        ))}
      </>
    );
  } else if (tab === "materiais") {
    const { data } = await db
      .from("materials")
      .select(
        "id,title,description,category,plan,pages,cover,storage_path,published,downloadable,public_sample_url",
      )
      .order("title");
    content = (
      <>
        <p>
          Uploads ficam em armazenamento privado. A publicação só é permitida
          após o envio do arquivo. Amostras públicas exigem autorização
          editorial e inclusão em /samples.
        </p>
        {data?.map((m) => (
          <AdminEditor
            key={m.id}
            action="material"
            title={m.title}
            initial={m}
          />
        ))}
        <AdminEditor
          action="material"
          title="Novo material"
          initial={{
            id: "",
            title: "",
            description: "",
            category: "Exercícios",
            plan: "essencial",
            pages: 1,
            cover: "/covers/kit.png",
            storage_path: null,
            published: false,
            downloadable: true,
            public_sample_url: null,
          }}
        />
      </>
    );
  } else if (tab === "suporte") {
    const { data } = await db
      .from("support_settings")
      .select(
        "name,email,whatsapp,message,hours,enabled,legal_name,legal_document",
      )
      .eq("id", true)
      .single();
    content = (
      <AdminEditor
        action="support"
        title="Configurações → WhatsApp e Atendimento"
        initial={data || {}}
      />
    );
  } else if (tab === "alunos") {
    const [profilesResult, ordersResult, accessResult, deliveriesResult, attemptsResult, essaysResult] =
      await Promise.all([
        db.from("profiles").select("id,name,email,role").limit(500),
        db
          .from("orders")
          .select("id,email,name,plan,amount,status,created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        db
          .from("entitlements")
          .select("order_id,user_id,email,plan,active")
          .limit(500),
        db
          .from("email_deliveries")
          .select("order_id,email,status,last_error")
          .limit(500),
        db
          .from("assessment_attempts")
          .select("user_id,activity,collection_id,score,total,completed_at")
          .order("completed_at", { ascending: false })
          .limit(1000),
        db
          .from("essay_submissions")
          .select("user_id,status,score,created_at")
          .order("created_at", { ascending: false })
          .limit(1000),
      ]);
    const customers = new Map<string, CrmCustomer>();
    const crmResults = [profilesResult, ordersResult, accessResult, deliveriesResult];
    const activityResultsAvailable = !attemptsResult.error && !essaysResult.error;
    if (crmResults.some((result) => result.error))
      throw new Error("Não foi possível carregar o CRM. Tente novamente.");
    const truncated = crmResults.some((result) => (result.data?.length || 0) === 500);
    const ensure = (email: string) => {
      const key = email.toLowerCase();
      if (!customers.has(key))
        customers.set(key, {
          email: key,
          name: "",
          profile: null,
          orders: [],
          entitlements: [],
          deliveries: [],
          attempts: [],
          essays: [],
        });
      return customers.get(key)!;
    };
    (profilesResult.data as CrmProfile[] | null)?.forEach((profile) => {
      const customer = ensure(profile.email);
      customer.profile = profile;
      customer.name = profile.name;
    });
    (ordersResult.data as CrmOrder[] | null)?.forEach((order) => {
      const customer = ensure(order.email);
      customer.orders.push(order);
      if (!customer.name) customer.name = order.name;
    });
    (accessResult.data as CrmEntitlement[] | null)?.forEach((access) =>
      ensure(access.email).entitlements.push(access),
    );
    (deliveriesResult.data as CrmDelivery[] | null)?.forEach((delivery) =>
      ensure(delivery.email).deliveries.push(delivery),
    );
    const profileById = new Map(
      (profilesResult.data as CrmProfile[] | null)?.map((profile) => [profile.id, profile]) || [],
    );
    (activityResultsAvailable ? attemptsResult.data as CrmAttempt[] | null : null)?.forEach((attempt) => {
      const profile = profileById.get(attempt.user_id);
      if (profile) ensure(profile.email).attempts.push(attempt);
    });
    (activityResultsAvailable ? essaysResult.data as CrmEssay[] | null : null)?.forEach((essay) => {
      const profile = profileById.get(essay.user_id);
      if (profile) ensure(profile.email).essays.push(essay);
    });
    const needle = q.trim().toLowerCase();
    const rows = [...customers.values()]
      .filter((customer) => customer.profile?.role !== "admin" || customer.orders.length)
      .filter(
        (customer) =>
          !needle ||
          customer.email.includes(needle) ||
          customer.name.toLowerCase().includes(needle),
      )
      .sort(
        (a, b) =>
          (b.orders[0]?.created_at || "").localeCompare(
            a.orders[0]?.created_at || "",
          ) || a.email.localeCompare(b.email),
      );
    const paidCustomers = rows.filter((customer) =>
      customer.orders.some((order) => order.status === "paid"),
    ).length;
    const activeCustomers = rows.filter((customer) =>
      customer.entitlements.some((access) => access.active),
    ).length;
    const completedSessions = rows.reduce((total, customer) => total + customer.attempts.length, 0);
    const submittedEssays = rows.reduce((total, customer) => total + customer.essays.length, 0);
    content = (
      <>
        <div className="crm-heading">
          <div>
            <h2>CRM de alunos</h2>
            <p>
              Cadastros, pagamentos recebidos pela Cakto e acessos liberados no
              site, reunidos pelo e-mail da compra.
            </p>
          </div>
          <span className="crm-count">{rows.length} contato(s)</span>
        </div>
        {truncated && <p className="status-message" role="status">Esta visão está limitada a 500 registros por fonte. Os totais e a busca consideram somente os registros carregados.</p>}
        {!activityResultsAvailable && <p className="status-message" role="status">Atividade detalhada ainda não está disponível neste ambiente. O CRM de pagamentos continua funcionando normalmente.</p>}
        <div className="stat-grid crm-stats admin-kpis">
          <div className="stat">
            <strong>{rows.length}</strong>
            <span>Contatos</span>
          </div>
          <div className="stat">
            <strong>{paidCustomers}</strong>
            <span>Com pagamento</span>
          </div>
          <div className="stat">
            <strong>{activeCustomers}</strong>
            <span>Com acesso ativo</span>
          </div>
          <div className="stat">
            <strong>{completedSessions}</strong>
            <span>Sessões concluídas</span>
          </div>
          <div className="stat">
            <strong>{submittedEssays}</strong>
            <span>Redações enviadas</span>
          </div>
        </div>
        <form className="filters">
          <input type="hidden" name="tab" value="alunos" />
          <input
            name="q"
            aria-label="Buscar aluno por nome ou e-mail"
            placeholder="Buscar por nome ou e-mail"
            defaultValue={q}
          />
          <button className="button primary">Buscar</button>
        </form>
        <div className="table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Contato</th>
                <th>Plano e acesso</th>
                <th>Pagamento</th>
                <th>Conta no site</th>
                <th>Atividade</th>
                <th>Última compra</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((customer) => {
                const active = customer.entitlements.filter(
                  (access) => access.active,
                );
                const plan = active.some((access) => access.plan === "premium")
                  ? "Premium"
                  : active.length
                    ? "Essencial"
                    : "Sem acesso";
                const lastOrder = customer.orders[0];
                const paidTotal = customer.orders
                  .filter((order) => order.status === "paid")
                  .reduce((total, order) => total + Number(order.amount) * 100, 0);
                return (
                  <tr key={customer.email}>
                    <td>
                      <strong>{customer.name || "Nome não informado"}</strong>
                      <a href={`mailto:${customer.email}`}>{customer.email}</a>
                      <details className="crm-user-details">
                        <summary>Ver atividade</summary>
                        <p><b>{customer.attempts.length}</b> sessão(ões) · <b>{customer.essays.length}</b> redação(ões)</p>
                        {customer.attempts.slice(0, 3).map((attempt) => <small key={`${attempt.user_id}-${attempt.completed_at}`}>{attempt.collection_id || attempt.activity} · {attempt.score}/{attempt.total} · {date(attempt.completed_at)}</small>)}
                        {!customer.attempts.length && <small>Nenhuma sessão registrada.</small>}
                      </details>
                    </td>
                    <td>
                      <span className={`crm-badge ${active.length ? "success" : "muted"}`}>
                        {plan}
                      </span>
                      <small>{active.length ? "Liberado" : "Inativo"}</small>
                    </td>
                    <td>
                      <strong>{orderStatus[lastOrder?.status] || "Sem pedido"}</strong>
                      <small>
                        {customer.orders.length} pedido(s)
                        {paidTotal ? ` · ${money(paidTotal)}` : ""}
                      </small>
                    </td>
                    <td>
                      <span
                        className={`crm-badge ${customer.profile ? "success" : "pending"}`}
                      >
                        {customer.profile ? "Criada" : "Aguardando acesso"}
                      </span>
                      <small>
                        {customer.deliveries[0]?.status === "failed"
                          ? "Boas-vindas com falha"
                          : customer.profile
                            ? "Cadastro disponível com senha"
                            : "Cadastro após pagamento aprovado"}
                      </small>
                    </td>
                    <td>
                      <strong>{customer.attempts.length} sessão(ões)</strong>
                      <small>{customer.essays.length ? `${customer.essays.length} redação(ões)` : "Sem redações"}</small>
                    </td>
                    <td>{date(lastOrder?.created_at)}</td>
                  </tr>
                );
              })}
              {!rows.length ? (
                <tr>
                  <td colSpan={6}>Nenhum contato encontrado.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </>
    );
  } else if (tab === "entregas") {
    const { data } = await db
      .from("email_deliveries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    content = (
      <>
        <p>
          A Cakto confirma o pagamento ao comprador. Este histórico registra
          apenas a preparação da conta e o e-mail opcional de boas-vindas do
          site. “accepted” não confirma leitura ou chegada na caixa de entrada.
        </p>
        {data?.map((d) => (
          <div key={d.id}>
            <p>
              {d.email} · {d.status} · {d.attempts} tentativa(s) ·{" "}
              {d.last_error || "Sem erro registrado"}
            </p>
            <AdminEditor
              action="resend"
              title="Reenviar instruções"
              initial={{ id: d.id }}
            />
          </div>
        ))}
      </>
    );
  } else if (tab === "integracoes") {
    const items = [
      [
        "Área de alunos e autenticação",
        mysqlConfigured(),
      ],
      [
        "Cakto — pagamentos e webhook",
        process.env.CAKTO_WEBHOOK_ENABLED === "true" &&
          !!process.env.CAKTO_WEBHOOK_SECRET,
      ],
      ["E-mail transacional opcional", !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM],
      ["Compras liberadas", checkoutConfigured()],
      [
        "Boas-vindas por e-mail (opcional)",
        !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM,
      ],
      ["Automação de boas-vindas (opcional)", !!process.env.CRON_SECRET],
      ["Meta Pixel", !!process.env.NEXT_PUBLIC_META_PIXEL_ID],
      ["Google Analytics", !!process.env.NEXT_PUBLIC_GA_ID],
      ["Correção de redação (OpenAI) — em manutenção", false],
      ["Auditoria de acesso por hash", !!process.env.ACCESS_FINGERPRINT_SALT],
    ];
    content = (
      <>
        <p>
          Configuração presente não substitui homologação de ponta a ponta. As
          credenciais são definidas no ambiente do servidor.
        </p>
        <ul className="task-list">
          {items.map(([name, ready]) => (
            <li key={String(name)}>
              <span>{name}</span>
              <b>{ready ? "Configuração presente" : "Pendente"}</b>
            </li>
          ))}
        </ul>
      </>
    );
  } else if (tab === "equipe") {
    content = <TeamManager />;
  } else if (tab === "tickets") {
    const { data, error } = await db.from("support_tickets").select("id,email,subject,message,status,priority,admin_note,created_at,updated_at").order("updated_at", { ascending: false }).limit(100);
    content = error ? <p className="status-message">O sistema de tickets ainda precisa da migração do banco para ser ativado.</p> : <TicketManager tickets={data || []} />;
  } else {
    const [{ data: overviewOrders }, stats] = await Promise.all([
      db
        .from("orders")
        .select("id,email,name,plan,amount,status,created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      Promise.all(
        [
          "profiles",
          "orders",
          "entitlements",
          "materials",
          "email_deliveries",
          "assessment_attempts",
          "essay_submissions",
          "account_access_fingerprints",
        ].map(async (table) => {
          let query = db.from(table).select("*", { count: "exact", head: true });
          if (table === "entitlements") query = query.eq("active", true);
          if (table === "materials") query = query.eq("published", true);
          if (table === "email_deliveries") query = query.eq("status", "failed");
          const { count, error } = await query;
          return { table, count: error ? null : count };
        }),
      ),
    ]);
    content = <AdminOverview stats={stats} orders={overviewOrders || []} />;
  }
  return (
    <main id="conteudo" className="admin-app">
      <aside className="admin-sidebar" aria-label="Navegação administrativa">
        <Link href="/admin?tab=visao" className="admin-brand" aria-label="GoDev Education, visão geral">
          <span>GoDev<span>.</span></span>
          <small>EDUCATION / ADMIN</small>
        </Link>
        <div className="admin-sidebar-label">Workspace</div>
        <nav className="admin-side-nav">
          {[
            ["visao", "Visão geral", "⌂"],
            ["alunos", "CRM de alunos", "◎"],
            ["produtos", "Produtos e planos", "◈"],
            ["materiais", "Materiais", "▤"],
            ["entregas", "Entregas e acessos", "↗"],
            ["equipe", "Equipe e permissões", "♙"],
          ].map(([id, label, icon]) => (
            <Link className="admin-side-link" key={id} href={`/admin?tab=${id}`} aria-current={tab === id ? "page" : undefined}>
              <span className="admin-side-icon" aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-label">Atendimento</div>
        <nav className="admin-side-nav">
          {[
            ["tickets", "Tickets", "◌"],
            ["suporte", "WhatsApp e suporte", "◉"],
            ["integracoes", "Integrações", "⚙"],
          ].map(([id, label, icon]) => (
            <Link className="admin-side-link" key={id} href={`/admin?tab=${id}`} aria-current={tab === id ? "page" : undefined}>
              <span className="admin-side-icon" aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-profile">
            <span className="admin-avatar" aria-hidden="true">{(who.profile?.name || "A").slice(0, 1).toUpperCase()}</span>
            <span><strong>{who.profile?.name || "Administrador"}</strong><small>Administrador</small></span>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="admin-logout" aria-label="Sair da conta">↪</button>
          </form>
        </div>
      </aside>
      <section className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <span className="admin-topbar-kicker">GoDev Education · Operação</span>
            <strong>Painel de controle</strong>
          </div>
          <div className="admin-topbar-actions">
            <Link className="admin-open-student" href="/aluno">Abrir área do aluno</Link>
            <span className="admin-live-indicator"><i /> Dados conectados</span>
          </div>
        </header>
        <div className="admin-content">
          <div className="admin-hero">
            <div>
              <span className="eyebrow">Central de gestão</span>
              <h1 className="page-title">Administração</h1>
              <p>Veja o que está acontecendo no produto, nos acessos e na jornada dos alunos.</p>
            </div>
          </div>
          {content}
        </div>
      </section>
    </main>
  );
}

