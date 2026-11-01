import { redirect } from "next/navigation";
import { identity } from "../../lib/supabase";
import { Brand } from "../../components/site";
import PortalNav from "../../components/portal-nav";
import ResponsiveDrawerToggle from "../../components/responsive-drawer-toggle";
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
      <aside id="student-navigation" className="sidebar">
        <Brand />
        <PortalNav isAdmin={who.profile?.role === "admin"} />
        <form method="post" action="/api/auth/logout">
          <button>Sair</button>
        </form>
      </aside>
      <main className="workspace" id="conteudo">
        <header className="portal-topbar">
          <ResponsiveDrawerToggle target="student" label="do aluno" />
          <label className="portal-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="5.8" /><path d="m15.2 15.2 4.3 4.3" /></svg><input aria-label="Buscar nos estudos" placeholder="Buscar nos estudos" /></label>
          <button className="portal-notification" type="button" aria-label="Notificações"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 10a6 6 0 0 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8M10 21h4" /></svg></button>
          <span className="portal-user-avatar" aria-hidden="true">{(who.profile?.name || "E").slice(0, 1).toUpperCase()}</span>
          <span className="portal-user-name">{who.profile?.name?.split(" ")[0] || "Estudante"}</span>
        </header>
        {children}
      </main>
    </div>
  );
}


