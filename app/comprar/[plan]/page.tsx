import { notFound, redirect } from "next/navigation";
import { identity } from "../../../lib/supabase";
import { Header, Footer } from "../../../components/site";
import { publicPlans } from "../../../lib/catalog";
import { checkoutConfigured } from "../../../lib/readiness";
import { features } from "../../../lib/features";
import Link from "next/link";
export default async function Buy({
  params,
}: {
  params: Promise<{ plan: string }>;
}) {
  const { plan } = await params;
  const p = (await publicPlans()).find((p) => p.id === plan);
  if (!p) notFound();
  // Pix: quem já está logado vai direto à revisão do pedido; quem não está entra (ou cria a conta grátis) e volta ao checkout.
  const signedIn = features.pix && p.id !== undefined ? await identity().catch(() => null) : null;
  if (features.pix && signedIn) redirect(`/aluno/checkout/${p.id}`);
  const back = encodeURIComponent(`/aluno/checkout/${p.id}`);
  return (
    <>
      <Header />
      <main id="conteudo" className="container section">
        <div className="form-card">
          <h1>
            Seu próximo passo:
            <br />
            {p.name}.
          </h1>
          <p>Desbloqueia ENEM 2027</p>
          <p className="price">{(p.cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
          <ul>{p.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          <p>
            Antes de comprar, confira os itens do plano e nossa{" "}
            <Link href="/politicas/reembolso" style={{ textDecoration: "underline", textUnderlineOffset: 3 }}>
              política de reembolso de sete dias
            </Link>
            .
          </p>
          <p className="status-message" hidden={features.pix}>Após o pagamento aprovado pela Cakto, o acesso é vinculado ao e-mail informado na compra. Você receberá instruções para criar sua senha e entrar na área de alunos.</p>
          {features.pix ? (
            <>
              <p className="status-message">Pagamento único por Pix. Para registrar o pedido, entre na sua conta ou crie uma conta grátis, sem cartão.</p>
              <Link className="button primary" href={`/entrar?redirect=${back}`}>Entrar para pagar</Link>{" "}
              <Link className="button secondary" href={`/entrar?modo=cadastro&redirect=${back}`}>Criar conta grátis</Link>
            </>
          ) : checkoutConfigured() ? (
            <a className="button primary" href={`/api/checkout/${p.id}`}>
              Continuar para o pagamento
            </a>
          ) : (
            <div className="status-message">
              As vendas ainda não estão abertas. A compra ficará disponível
              quando o pagamento e a entrega estiverem prontos.
            </div>
          )}
          <Link className="text-link" href="/#planos">
            Voltar aos planos
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
