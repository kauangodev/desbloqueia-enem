import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { PixPanel } from "../../../../components/aluno/pix-actions";
import { brl } from "../../../../lib/pricing";
import { offerByCode, orderForUser } from "../../../../lib/pix/store";
import { identity } from "../../../../lib/supabase";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pagamento por Pix | GoDev Education", robots: { index: false, follow: false } };

const statusText: Record<string, string> = {
  aguardando_pix: "Aguardando pagamento", em_conferencia: "Aguardando conferência", pago: "Pago · acesso ativo", expirado: "Expirado", cancelado: "Cancelado", reembolsado: "Reembolsado",
};

export default async function PixOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const who = await identity();
  if (!who || !/^[0-9a-f-]{36}$/.test(id)) notFound();
  const order = await orderForUser(who.user.id, id).catch(() => null);
  if (!order) notFound();
  const offer = await offerByCode(order.offerCode).catch(() => null);
  const open = order.status === "aguardando_pix" || order.status === "em_conferencia" || order.status === "expirado";
  // O QR é desenhado a partir do MESMO texto do Copia e Cola: os dois sempre representam o mesmo código.
  const svg = open && offer?.copyPaste ? await QRCode.toString(offer.copyPaste, { type: "svg", margin: 1, width: 240, errorCorrectionLevel: "M" }) : null;
  const reviewHours = offer ? Math.round(offer.reviewMinutes / 60) : 24;
  return (
    <div className="as-page">
      <header className="as-head"><div><h1>Pagamento por Pix</h1><p>Pedido {order.id.slice(0, 8)} · {order.tier === "premium" ? "Premium" : "Essencial"} · {brl(order.expectedCents)}</p></div></header>
      <section className="as-card" aria-live="polite">
        <h2>{statusText[order.status] ?? order.status}</h2>
        {order.status === "pago" ? <p>Seu acesso está ativo. <Link className="op-link" href="/aluno">Ir para o Início</Link></p> : null}
        {order.status === "em_conferencia" ? <p>Recebemos o seu aviso. Conferimos o crédito na conta recebedora em até {reviewHours} h (dias úteis podem levar mais). Você não precisa pagar de novo.</p> : null}
        {order.status === "expirado" ? <p>Este pedido passou do prazo no site. Se você já pagou, use “Já fiz o Pix” e conferimos; se não pagou, comece um novo pedido em <Link className="op-link" href="/aluno/planos">Planos</Link>.</p> : null}
        {order.status === "reembolsado" ? <p>Este pagamento foi devolvido e o acesso correspondente foi encerrado.</p> : null}
      </section>
      {open && offer?.copyPaste ? (
        <section className="as-card" aria-labelledby="pix-h">
          <h2 id="pix-h">Pague {brl(order.expectedCents)} por Pix</h2>
          <p className="as-muted">Recebedor: <strong>{offer.receiverName}</strong>. No aplicativo do banco, confira se o nome e o valor são esses antes de confirmar.</p>
          {svg ? <div role="img" aria-label="QR Code do Pix" style={{ background: "#fff", padding: 8, borderRadius: 12, width: 256, maxWidth: "100%" }} dangerouslySetInnerHTML={{ __html: svg }} /> : null}
          <PixPanel orderId={order.id} copyPaste={offer.copyPaste} canNotify={order.status === "aguardando_pix" || order.status === "expirado"} />
          <p className="as-muted">Pagou? Toque em “Já fiz o Pix”. O acesso é liberado depois que conferimos o crédito na conta do recebedor.</p>
        </section>
      ) : null}
      <p><Link className="op-link" href="/aluno/pagamentos">Meus pagamentos</Link></p>
    </div>
  );
}
