import { notFound } from "next/navigation";
import { Header, Footer } from "../../../components/site";
import { publicPlans } from "../../../lib/catalog";
import { checkoutConfigured } from "../../../lib/readiness";
import Link from "next/link";
export default async function Buy({
  params,
}: {
  params: Promise<{ plan: string }>;
}) {
  const { plan } = await params;
  const p = (await publicPlans()).find((p) => p.id === plan);
  if (!p) notFound();
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
          <p>Desbloqueia ENEM 2026</p>
          <p className="price">{(p.cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
          <ul>{p.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          <p>
            Antes de comprar, confira os itens do plano e nossa{" "}
            <Link href="/politicas/reembolso">
              política de reembolso de sete dias
            </Link>
            .
          </p>
          <p className="status-message">Após o pagamento aprovado pela Cakto, o acesso é vinculado ao e-mail informado na compra. Você receberá instruções para criar sua senha e entrar na área de alunos.</p>
          {checkoutConfigured() ? (
            <Link className="button primary" href={`/api/checkout/${p.id}`}>
              Continuar para o pagamento
            </Link>
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
