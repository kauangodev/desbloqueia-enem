import Link from "next/link";
import { notFound } from "next/navigation";
import { StartPix } from "../../../../components/aluno/pix-actions";
import { brl } from "../../../../lib/pricing";
import { activeOffer } from "../../../../lib/pix/store";
import { identity } from "../../../../lib/supabase";
import { plans } from "../../../../lib/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Revisar pedido | GoDev Education", robots: { index: false, follow: false } };

export default async function CheckoutPage({ params }: { params: Promise<{ plan: string }> }) {
  const { plan } = await params;
  if (plan !== "essencial" && plan !== "premium") notFound();
  const who = await identity();
  const info = plans.find((p) => p.id === plan)!;
  let offer: Awaited<ReturnType<typeof activeOffer>> = null;
  try { offer = await activeOffer(plan); } catch { offer = null; }
  return (
    <div className="as-page">
      <header className="as-head"><div><h1>Revisar pedido</h1><p>Pagamento único por Pix, sem renovação automática.</p></div></header>
      <section className="as-card" aria-labelledby="ck-h">
        <h2 id="ck-h">{info.name}</h2>
        <ul className="as-list">
          {info.features.map((f) => <li key={f}><span>{f}</span></li>)}
        </ul>
        <p><strong>Conta que recebe o acesso:</strong> {who?.user.email}</p>
        {offer ? (
          <>
            <p><strong>Total:</strong> {brl(offer.cents)} <span className="as-muted">(pagamento único, sem taxas adicionais da GoDev)</span></p>
            <p className="as-muted">Recebedor: {offer.receiverName}. Confira esse nome no aplicativo do seu banco antes de confirmar.</p>
            <StartPix tier={plan} />
          </>
        ) : (
          <p className="as-muted" role="status">O pagamento por Pix deste plano ainda não está disponível. Você pode continuar estudando no plano Grátis e voltar aqui em breve, ou falar com o <Link className="op-link" href="/aluno/suporte">atendimento</Link>.</p>
        )}
      </section>
      <p><Link className="op-link" href="/aluno/pagamentos">Meus pagamentos</Link></p>
    </div>
  );
}
