import "katex/dist/katex.min.css";
import Link from "next/link";
import OperacaoSubnav from "../../../components/operacao/subnav";
import { campaignStatus, operacao } from "../../../lib/operacao/config";
import { operacaoUser } from "../../../lib/operacao/store";

export const dynamic = "force-dynamic";
export const metadata = { title: `${operacao.name} — ${operacao.subtitle}`, robots: { index: false, follow: false } };

export default async function OperacaoLayout({ children }: { children: React.ReactNode }) {
  const user = await operacaoUser();
  if (!user) {
    return (
      <div className="op-root"><section className="op-card op-empty"><h1>{operacao.name}</h1><p>Este conteúdo faz parte do plano Essencial. Se você já tem acesso e viu esta mensagem, entre em contato pelo atendimento.</p><Link className="op-btn op-btn-primary" href="/aluno/suporte">Falar com o atendimento</Link></section></div>
    );
  }
  const status = campaignStatus();
  return (
    <div className="op-root">
      <header className="op-head">
        <p className="op-eyebrow"><span className="op-badge">{operacao.badge}</span> {operacao.subtitle}</p>
        <h1>{operacao.name}</h1>
        <p className="op-status" role="status">{status.headline}</p>
      </header>
      <OperacaoSubnav base={operacao.basePath} />
      {children}
    </div>
  );
}
