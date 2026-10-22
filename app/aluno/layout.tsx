import { redirect } from "next/navigation";
import { identity } from "../../lib/supabase";
import { Brand } from "../../components/site";
import PortalNav from "../../components/portal-nav";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const who = await identity();
  if (!who) redirect("/entrar");
  return (
    <div className="portal">
      <aside className="sidebar">
        <Brand />
        <PortalNav />
        <form method="post" action="/api/auth/logout">
          <button>Sair</button>
        </form>
      </aside>
      <main className="workspace" id="conteudo">
        <div className="workspace-bar">
          <span>Desbloqueia ENEM 2026</span>
          <span>{who.profile?.name || "Seu espaço de estudo"}</span>
        </div>
        {children}
      </main>
    </div>
  );
}
