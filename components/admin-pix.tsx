"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type PixOfferView = { code: string; tier: "essencial" | "premium"; version: number; cents: number; status: string; receiverName: string; hasCode: boolean; reviewMinutes: number; problems: string[] };
export type PixOrderView = { id: string; student: string; email: string; tier: string; cents: number; status: string; statusLabel: string; createdAt: string; notifiedAt: string | null; bankRef: string | null };

async function act(body: unknown): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/admin/pix", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, error: data.error };
}
const brl = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

export function OfferEditor({ tier, current, live, canManage }: { tier: "essencial" | "premium"; current: PixOfferView | null; live: PixOfferView | null; canManage: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const label = tier === "premium" ? "Premium" : "Essencial";
  return (
    <section className="admin-card" aria-labelledby={`of-${tier}`} style={{ padding: 16, marginBottom: 16 }}>
      <h3 id={`of-${tier}`}>{label}</h3>
      {live && current && live.code !== current.code ? <p>À venda agora: <strong>{live.code}</strong> · {brl(live.cents)}. A versão abaixo é um rascunho: só passa a valer quando você ativar.</p> : null}
      {current ? <p>{live && current.code === live.code ? "Versão à venda:" : "Versão em edição:"} <strong>{current.code}</strong> · {brl(current.cents)} · {current.status === "ativa" ? "ATIVA (à venda)" : current.status === "rascunho" ? "rascunho (não está à venda)" : "encerrada"} · recebedor {current.receiverName || "—"} · {current.hasCode ? "código informado" : "sem código"}{current.problems.length ? <> · <span role="alert">pendências: {current.problems.join("; ")}</span></> : null}</p> : <p>Nenhuma oferta criada. Enquanto não houver oferta ativa, o plano aparece como indisponível para pagamento.</p>}
      {canManage ? (
        <form onSubmit={async (e) => {
          e.preventDefault(); setBusy(true); setMsg("");
          const f = new FormData(e.currentTarget);
          const price = Number(String(f.get("price") || "").replace(",", "."));
          const r = await act({ action: "offerDraft", tier, cents: Math.round(price * 100), receiverName: String(f.get("receiver") || ""), copyPaste: String(f.get("code") || "").trim() || null, reviewMinutes: Math.round(Number(f.get("hours") || 24) * 60) });
          setMsg(r.ok ? "Rascunho salvo (nova versão). Confira a prévia e ative." : r.error || "Não foi possível salvar."); setBusy(false);
          if (r.ok) router.refresh();
        }}>
          <label className="field">Preço final (R$)<input name="price" inputMode="decimal" defaultValue={current ? (current.cents / 100).toFixed(2).replace(".", ",") : ""} required /></label>
          <label className="field">Nome do recebedor (como aparece no banco)<input name="receiver" defaultValue={current?.receiverName} required maxLength={160} /></label>
          <label className="field">Pix Copia e Cola gerado no banco<textarea name="code" rows={3} maxLength={600} placeholder="Cole aqui o código do banco (valor fixo)" /></label>
          <label className="field">Prazo de conferência (horas)<input name="hours" type="number" min={1} max={168} defaultValue={current ? Math.round(current.reviewMinutes / 60) : 24} /></label>
          <button className="button secondary" disabled={busy}>Salvar rascunho</button>
          {current && current.status === "rascunho" ? <>
            {" "}<a className="button secondary" href={`/aluno/checkout/${tier}`} target="_blank" rel="noreferrer">Visualizar checkout</a>
            {" "}<button type="button" className="button primary" disabled={busy || current.problems.length > 0} onClick={async () => {
              if (!window.confirm(`Ativar ${current.code} por ${brl(current.cents)}? Você conferiu a prévia com o aplicativo do banco?`)) return;
              setBusy(true); const r = await act({ action: "offerActivate", code: current.code }); setMsg(r.ok ? "Oferta ativada." : r.error || "Falha ao ativar."); setBusy(false); if (r.ok) router.refresh();
            }}>Ativar Pix</button></> : null}
        </form>
      ) : <p>Somente leitura: você não tem permissão para editar ofertas.</p>}
      <p role="status" hidden={!msg}>{msg}</p>
    </section>
  );
}

export function OrderRow({ order, canReconcile, receiver }: { order: PixOrderView; canReconcile: boolean; receiver: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const canConfirm = canReconcile && ["aguardando_pix", "em_conferencia", "expirado"].includes(order.status);
  return (
    <tr>
      <th scope="row">{order.student}<br /><small>{order.email}</small></th>
      <td>{order.tier === "premium" ? "Premium" : "Essencial"}<br /><small>{brl(order.cents)}</small></td>
      <td>{order.statusLabel}{order.bankRef ? <><br /><small>ref. {order.bankRef}</small></> : null}</td>
      <td>{new Date(order.createdAt).toLocaleString("pt-BR")}{order.notifiedAt ? <><br /><small>aviso: {new Date(order.notifiedAt).toLocaleString("pt-BR")}</small></> : null}</td>
      <td>
        {canConfirm ? <button type="button" className="button secondary" onClick={() => setOpen(!open)} aria-expanded={open}>Conferir</button> : null}
        {canReconcile && order.status === "pago" ? <button type="button" className="button secondary" onClick={async () => {
          const ref = window.prompt("Referência da devolução confirmada no banco (mín. 8 caracteres):"); if (!ref) return;
          setBusy(true); const r = await act({ action: "refund", orderId: order.id, reference: ref }); setMsg(r.ok ? "Reembolso registrado; acesso deste pedido revogado." : r.error || "Falha."); setBusy(false); if (r.ok) router.refresh();
        }} disabled={busy}>Registrar reembolso</button> : null}
        {open ? (
          <form onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const amount = Math.round(Number(String(f.get("amount")).replace(",", ".")) * 100);
            if (!window.confirm(`Confirmar ${order.student} (${order.email}) · ${order.tier} · ${brl(amount)}? O acesso será liberado agora.`)) return;
            setBusy(true);
            const r = await act({ action: "confirm", orderId: order.id, bankRef: String(f.get("ref") || ""), amountCents: amount, receivedAt: String(f.get("at") || ""), receiver: String(f.get("receiver") || "") });
            setMsg(r.ok ? "Confirmado. Acesso liberado." : r.error || "Não foi possível confirmar."); setBusy(false); if (r.ok) router.refresh();
          }}>
            <p><small>Confira no EXTRATO da conta recebedora: valor, data/hora, recebedor e o identificador da transação (EndToEndId). O comprovante do aluno é só apoio.</small></p>
            <label className="field">Identificador bancário (EndToEndId)<input name="ref" required minLength={8} maxLength={64} /></label>
            <label className="field">Valor recebido (R$)<input name="amount" inputMode="decimal" required defaultValue={(order.cents / 100).toFixed(2).replace(".", ",")} /></label>
            <label className="field">Data e hora do crédito<input name="at" type="datetime-local" required /></label>
            <label className="field">Recebedor<input name="receiver" required defaultValue={receiver} /></label>
            <button className="button primary" disabled={busy}>Confirmar e liberar acesso</button>
          </form>
        ) : null}
        <p role="status" hidden={!msg}><small>{msg}</small></p>
      </td>
    </tr>
  );
}
