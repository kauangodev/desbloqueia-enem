import { redirect } from "next/navigation";
import { Brand } from "../../components/site";
import PortalNav from "../../components/portal-nav";
import CookiePreferencesLink from "../../components/cookie-preferences-link";
import ResponsiveDrawerToggle from "../../components/responsive-drawer-toggle";
import ThemeToggle from "../../components/theme-toggle";
import OnboardingGate from "../../components/aluno/onboarding-gate";
import { features } from "../../lib/features";
import { operacaoUser } from "../../lib/operacao/store";
import { loadOnboarding } from "../../lib/onboarding/store";
import { freeScope } from "../../lib/planos/free";
import TopbarChips from "../../components/aluno/topbar-chips";
import UpsellCard from "../../components/aluno/upsell-card";
import { studentSummary } from "../../lib/aluno/summary";
import "../aluno-shell.css";
import "../aluno-redesign.css";
import "../trilha.css";
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };
export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const summary = await studentSummary();
  if (!summary) redirect("/entrar");
  const { who, isAdmin, plan, planLabel, momentum } = summary;
  if (who.user.must_change_password) redirect("/definir-senha?first=1");
  const name = who.profile?.name || "Estudante";
  // Onboarding (chave NEXT_PUBLIC_FEATURE_ONBOARDING): falha de leitura nunca bloqueia o estudo, só deixa de mostrar o modal.
  let onboarding: { state: Awaited<ReturnType<typeof loadOnboarding>>; freeLimit: number | null } | null = null;
  if (features.onboarding) {
    try {
      const student = await operacaoUser();
      if (student) {
        const state = await loadOnboarding(student.kv);
        if (!state.completedAt) onboarding = { state, freeLimit: student.tier === "gratis" ? freeScope().questionsPerDay : null };
      }
    } catch { onboarding = null; }
  }
  return (
    <div className="portal">
      <aside id="student-navigation" className="sidebar">
        <Brand />
        <PortalNav isAdmin={isAdmin} />
        <UpsellCard plan={plan} />
        <form method="post" action="/api/auth/logout">
          <button>Sair</button>
        </form>
        <CookiePreferencesLink className="cookie-link cookie-link-side" />
      </aside>
      <main className="workspace" id="conteudo">
        <header className="portal-topbar">
          <ResponsiveDrawerToggle target="student" label="do aluno" />
          <form className="portal-search" role="search" action="/aluno/materiais" method="get"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="5.8" /><path d="m15.2 15.2 4.3 4.3" /></svg><input name="q" type="search" aria-label="Buscar nos materiais" placeholder="Buscar nos materiais" enterKeyHint="search" /></form>
          <ThemeToggle className="header-theme portal-theme" />
          {momentum ? <TopbarChips data={momentum} dailyGoal={summary.progress?.gamification.dailyGoal ?? 10} /> : null}
          <span className="portal-user-avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
          <span className="portal-user-name">{name.split(" ")[0]}</span>
        </header>
        <div className="workspace-scroll">{children}</div>
        {onboarding ? <OnboardingGate initial={onboarding.state} freeLimit={onboarding.freeLimit} /> : null}
      </main>
    </div>
  );
}
