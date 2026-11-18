import Link from "next/link";
import { brl } from "../../../lib/pricing";
import { ordersOfUser } from "../../../lib/pix/store";
import { identity } from "../../../lib/supabase";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meus pagamentos | GoDev Education", robots: { index: false, follow: false } };

const statusText: Record<string, string> = {
  aguardando_pix: "Aguardando pagamento", em_conferencia: "Aguardando conferência", pago: "Pago · acesso ativo", expirado: "Expirado", cancelado: "Cancelado", reembolsado: "Reembolsado",
};

export default async function PaymentsPage() {
  const who = await identity();
  let orders: Awaited<ReturnType<typeof ordersOfUser>> = [];
  let failed = false;
  try { if (who) orders = await ordersOfUser(who.user.id); } catch { failed = true; }
  return (
    <div className="as-page">
      <header className="as-head"><div><h1>Meus pagamentos</h1><p>Pedidos por Pix e o estado de cada um.</p></div><Link className="as-btn" href="/aluno/planos">Ver planos</Link></header>
      {failed ? <p className="op-error" role="alert">Não foi possível carregar seus pedidos agora.</p> : null}
      {orders.length ? (
        <section className="as-card">
          <ul className="as-list">
            {orders.map((o) => (
              <li key={o.id}>
                <span><strong>{o.tier === "premium" ? "Premium" : "Essencial"} · {brl(o.expectedCents)}</strong><br /><small className="as-muted">{new Date(o.createdAt).toLocaleDateString("pt-BR")} · {statusText[o.status] ?? o.status} · pedido {o.id.slice(0, 8)}</small></span>
                <Link className="op-link" href={`/aluno/pagamentos/${o.id}`}>Abrir</Link>
              </li>
            ))}
          </ul>
        </section>
      ) : !failed ? <section className="as-empty"><h2>Nenhum pedido ainda</h2><p className="as-muted">Quando você escolher um plano pago, o pedido aparece aqui.</p></section> : null}
    </div>
  );
}
