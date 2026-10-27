import { identity, serviceClient } from "../../lib/supabase";
import { redirect } from "next/navigation";
import { Header, Footer } from "../../components/site";
import AdminEditor from "../../components/admin-editor";
import Link from "next/link";
import { money } from "../../lib/config";
import { checkoutConfigured } from "../../lib/readiness";
import TicketManager from "../../components/ticket-manager";
import AdminOverview from "../../components/admin-overview";
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