import "katex/dist/katex.min.css";
import Link from "next/link";
import OperacaoHead from "../../../components/operacao/head";
import OperacaoSubnav from "../../../components/operacao/subnav";
import { editionCalendar, operacao } from "../../../lib/operacao/config";
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
  // O aviso de calendário só aparece na visão geral (dentro do cabeçalho); nas ferramentas não disputa espaço com o conteúdo.
  const calendar = editionCalendar();
  const note = calendar ? `${calendar.note.headline}. ${calendar.note.detail}` : undefined;
  return (
    <div className="op-root">
      <OperacaoHead base={operacao.basePath} name={operacao.name} subtitle={operacao.subtitle} note={note} />
      <OperacaoSubnav base={operacao.basePath} />
      {children}
    </div>
  );
}
