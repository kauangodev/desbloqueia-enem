import { redirect } from "next/navigation";
import { identity } from "../../lib/supabase";
import { Brand } from "../../components/site";
import PortalNav from "../../components/portal-nav";
import ThemeToggle from "../../components/theme-toggle";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const who = await identity();
  if (!who) redirect("/entrar");
  if (who.user.must_change_password) redirect("/definir-senha?first=1");
  return (
    <div className="portal">
      <aside className="sidebar">
        <Brand />
        <PortalNav isAdmin={who.profile?.role === "admin"} />
        <form method="post" action="/api/auth/logout">
          <button>Sair</button>
        </form>
      </aside>
      <main className="workspace" id="conteudo">
        <div className="workspace-bar">
          <span>Desbloqueia ENEM 2026</span>
          <span className="workspace-bar-tools"><ThemeToggle /><span>Área protegida</span></span>
        </div>
        {children}
      </main>
    </div>
  );
}

