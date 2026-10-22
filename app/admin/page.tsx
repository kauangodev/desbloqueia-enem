import { identity, serviceClient } from "../../lib/supabase";
import { redirect } from "next/navigation";
import { Header, Footer } from "../../components/site";
import AdminEditor from "../../components/admin-editor";
import Link from "next/link";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administração | GoDev Education",
  robots: { index: false, follow: false },
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
    const query = db
      .from("profiles")
      .select("id,name,email,role")
      .order("name")
      .limit(100);
    if (q) query.ilike("email", `%${q.replace(/[%_]/g, "")}%`);
    const { data } = await query;
    const { data: orders } = await db
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    content = (
      <>
        <form className="filters">
          <input type="hidden" name="tab" value="alunos" />
          <input
            name="q"
            aria-label="Buscar aluno por e-mail"
            placeholder="Buscar por e-mail"
            defaultValue={q}
          />
          <button className="button primary">Buscar</button>
        </form>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Papel</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.email}</td>
                  <td>{p.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2>Últimos pedidos</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>E-mail</th>
                <th>Plano</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders
                ?.filter((o) => !q || o.email.includes(q))
                .map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.email}</td>
                    <td>{o.plan}</td>
                    <td>{o.status}</td>
                  </tr>
                ))}
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
          “accepted” significa aceito pelo provedor, não confirmação de leitura
          ou chegada na caixa de entrada. Reenvios entram na fila do worker.
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
      ["Banco e autenticação", !!process.env.NEXT_PUBLIC_SUPABASE_URL],
      [
        "Recepção Cakto",
        process.env.CAKTO_WEBHOOK_ENABLED === "true" &&
          !!process.env.CAKTO_WEBHOOK_SECRET,
      ],
      ["Compras", process.env.CHECKOUT_ENABLED === "true"],
      [
        "E-mail transacional",
        !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM,
      ],
      ["Worker de entrega", !!process.env.CRON_SECRET],
      ["Meta Pixel", !!process.env.NEXT_PUBLIC_META_PIXEL_ID],
      ["Google Analytics", !!process.env.NEXT_PUBLIC_GA_ID],
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
  } else {
    const stats = await Promise.all(
      [
        "profiles",
        "orders",
        "entitlements",
        "materials",
        "email_deliveries",
      ].map(async (table) => {
        let query = db.from(table).select("*", { count: "exact", head: true });
        if (table === "entitlements") query = query.eq("active", true);
        if (table === "materials") query = query.eq("published", true);
        if (table === "email_deliveries") query = query.eq("status", "failed");
        const { count, error } = await query;
        return { table, count: error ? null : count };
      }),
    );
    const labels: Record<string, string> = {
      profiles: "Alunos",
      orders: "Pedidos",
      entitlements: "Acessos ativos",
      materials: "Materiais publicados",
      email_deliveries: "Falhas de entrega",
    };
    content = (
      <div className="stat-grid">
        {stats.map((s) => (
          <div className="stat" key={s.table}>
            <strong>{s.count ?? "Indisponível"}</strong>
            <span>{labels[s.table]}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <>
      <Header />
      <main id="conteudo" className="container section">
        <h1 className="page-title">Administração</h1>
        <nav className="admin-tabs" aria-label="Administração">
          {[
            ["visao", "Visão geral"],
            ["produtos", "Produtos"],
            ["materiais", "Materiais"],
            ["alunos", "Alunos e pedidos"],
            ["entregas", "Entregas"],
            ["suporte", "WhatsApp e Atendimento"],
            ["integracoes", "Integrações"],
          ].map(([id, label]) => (
            <Link
              key={id}
              href={`/admin?tab=${id}`}
              aria-current={tab === id ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        {content}
      </main>
      <Footer />
    </>
  );
}
