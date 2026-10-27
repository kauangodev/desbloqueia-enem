import { Header, Footer } from "../../../components/site";
import { notFound } from "next/navigation";
import Link from "next/link";
import Support from "../../../components/support";
const policies: Record<
  string,
  { title: string; sections: [string, string][] }
> = {
  privacidade: {
    title: "Política de privacidade",
    sections: [
      [
        "Dados para o seu acesso",
        "A plataforma usa o e-mail, nome, identificador da compra e plano adquirido para identificar sua conta e liberar os materiais. O progresso de leitura e as tarefas do cronograma são associados à sua conta quando você usa esses recursos.",
      ],
      [
        "Pagamento e serviços contratados",
        "O pagamento será processado pela Cakto quando as vendas forem abertas. A plataforma não coleta nem armazena dados completos de cartão. Autenticação e dados operacionais usam a infraestrutura MySQL contratada na Hostinger; o envio transacional usa o provedor de e-mail contratado quando configurado. Esses serviços podem processar dados em outros países, conforme seus contratos e políticas.",
      ],
      [
        "Cookies e métricas",
        "Cookies de autenticação são necessários para manter sua sessão. Métricas de marketing só são carregadas com consentimento e quando configuradas. Você pode alterar sua preferência pelo controle de cookies no rodapé. Não usamos cliques como prova de compra.",
      ],
      [
        "Retenção e seus direitos",
        "Mantemos os dados necessários ao acesso, atendimento e cumprimento de obrigações aplicáveis. Você pode solicitar acesso, correção ou exclusão pelo atendimento. Dados necessários à comprovação de transações podem precisar ser conservados por exigência aplicável. Não venda nem compartilhe seu link de acesso.",
      ],
      [
        "Estudantes menores de idade",
        "Se você é menor de idade, peça a participação do seu responsável na compra e no uso da plataforma. Os recursos de estudo não exigem que você forneça informações sensíveis.",
      ],
      [
        "Responsável e contato",
        "Os dados do responsável comercial e os canais de privacidade serão publicados antes da abertura das vendas. Enquanto não estiverem configurados, a compra permanecerá indisponível.",
      ],
    ],
  },
  termos: {
    title: "Termos de uso",
    sections: [
      [
        "Produto e conteúdo",
        "GoDev Education apresenta o Desbloqueia ENEM 2026, material independente e complementar de estudo. Não é uma publicação do INEP/MEC e não oferece garantia de nota ou aprovação. Os itens incluídos em cada plano estão descritos na página de planos vigente na compra.",
      ],
      [
        "Conta e acesso",
        "O acesso é pessoal, por e-mail. A liberação depende de pagamento confirmado e do plano adquirido. O uso indevido, a distribuição não autorizada dos arquivos e o compartilhamento de links privados não são permitidos. O material pode ser baixado quando o recurso estiver autorizado.",
      ],
      [
        "Fontes externas",
        "A biblioteca histórica organiza referências e direciona para sites de terceiros. Ela não contém 1.800 resoluções autorais. A disponibilidade e as políticas desses sites são de responsabilidade de seus operadores.",
      ],
      [
        "Disponibilidade",
        "A conexão com a internet é necessária para acessar a plataforma. Interrupções podem ocorrer para manutenção ou por falhas técnicas. Consulte o atendimento em caso de dificuldade persistente.",
      ],
      [
        "Compras e atendimento",
        "As compras estão em preparação. Antes da abertura, o responsável comercial, os canais de atendimento e as configurações de pagamento e entrega devem estar definidos. As condições de reembolso estão na política específica.",
      ],
    ],
  },
  reembolso: {
    title: "Política de reembolso",
    sections: [
      [
        "Sete dias para decidir",
        "A oferta prevê sete dias de garantia contados da compra. Nesse período, você pode solicitar o reembolso pelo canal indicado no comprovante de pagamento ou pelo atendimento oficial da GoDev Education.",
      ],
      [
        "Como solicitar",
        "Informe o e-mail utilizado na compra e o identificador do pedido. Não envie senhas, códigos de acesso nem dados completos do cartão. Quando as vendas estiverem abertas, os canais oficiais estarão disponíveis nesta página e no comprovante.",
      ],
      [
        "Após a solicitação",
        "O atendimento orientará o procedimento junto ao processador do pagamento. A devolução segue o meio utilizado e os prazos informados pelo processador e pela instituição financeira. A plataforma não promete estorno imediato.",
      ],
      [
        "O que acontece com o acesso",
        "Após a confirmação do reembolso ou chargeback, o acesso vinculado àquele pedido será revogado. Outras compras válidas permanecem ativas. O conteúdo já baixado não deve ser redistribuído.",
      ],
      [
        "Pagamento pela Cakto",
        "O checkout é processado pela Cakto. A liberação do acesso ocorre somente após a confirmação do pagamento e fica vinculada ao e-mail informado na compra.",
      ],
    ],
  },
};
export default async function Policy({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const policy = policies[page];
  if (!policy) notFound();
  return (
    <>
      <Header />
      <main className="container legal" id="conteudo">
        <Link className="text-link" href="/">
          Voltar ao início
        </Link>
        <h1 className="page-title" style={{ marginTop: 24 }}>
          {policy.title}
        </h1>
        <p>
          GoDev Education · Desbloqueia ENEM 2026
          <br />
          Atualizado em 22 de outubro de 2026.
        </p>
        {policy.sections.map(([title, text]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </section>
        ))}
        <h2>Atendimento</h2>
        <Support />
      </main>
      <Footer />
    </>
  );
}
