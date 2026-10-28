Warning: truncated output (original token count: 5925)
Total output lines: 590

import { identity, serviceClient } from "../../lib/supabase";
import { redirect } from "next/navigation";
import AdminEditor from "../../components/admin-editor";
import Link from "next/link";
import { money } from "../../lib/config";
import { checkoutConfigured } from "../../lib/readiness";
import { mysqlConfigured } from "../../lib/mysql";
import { META_PIXEL_ID } from "../../lib/meta-pixel";
import TicketManager from "../../components/ticket-manager";
import AdminOverview from "../../components/admin-overview";
import TeamManager from "../../components/team-manager";
import ManualAccessForm from "../../components/manual-access-form";
import ThemeToggle from "../../components/theme-toggle";
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
      …4925 tokens truncated…, "Integrações", "integrations"],
          ].map(([id, label, icon]) => (
            <Link className="admin-side-link" key={id} href={`/admin?tab=${id}`} aria-label={label} title={label} aria-current={tab === id ? "page" : undefined}>
              <span className="admin-side-icon"><AdminIcon name={icon} /></span>
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
            <button className="admin-logout" aria-label="Sair da conta" title="Sair da conta"><AdminIcon name="deliveries" /></button>
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
            <ThemeToggle />
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


