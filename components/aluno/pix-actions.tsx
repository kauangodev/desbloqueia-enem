"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

async function post(url: string, body?: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data } as { ok: boolean; data: { error?: string; redirect?: string } };
}

/** Botão "Pagar com Pix": cria (ou reaproveita) o pedido e abre a tela com o QR Code. */
export function StartPix({ tier }: { tier: "essencial" | "premium" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <button className="as-btn as-btn-primary" type="button" disabled={busy} onClick={async () => {
        setBusy(true); setError("");
        const r = await post("/api/pix/orders", { tier }).catch(() => null);
        if (r?.ok && r.data.redirect) router.push(r.data.redirect); else setError(r?.data.error || "Não foi possível iniciar o pagamento. Tente novamente.");
        setBusy(false);
      }}>{busy ? "Aguarde…" : "Pagar com Pix"}</button>
      <p role="alert" className="as-muted" hidden={!error}>{error}</p>
    </div>
  );
}

/** Copia o Pix Copia e Cola e registra "Já fiz o Pix". */
export function PixPanel({ orderId, copyPaste, canNotify }: { orderId: string; copyPaste: string; canNotify: boolean }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <div className="op-stack">
      <label className="as-muted" htmlFor="pix-code">Pix Copia e Cola</label>
      <textarea id="pix-code" readOnly rows={4} value={copyPaste} style={{ width: "100%", fontFamily: "monospace", fontSize: 13 }} onFocus={(e) => e.currentTarget.select()} />
      <div className="op-q-foot">
        <button type="button" className="as-btn as-btn-primary" onClick={async () => { try { await navigator.clipboard.writeText(copyPaste); setCopied(true); setMessage("Código copiado."); } catch { setMessage("Não foi possível copiar. Selecione o texto acima e copie manualmente."); } }}>{copied ? "Copiado" : "Copiar código"}</button>
        {canNotify ? (
          <button type="button" className="as-btn" disabled={busy} onClick={async () => {
            setBusy(true);
            const r = await post(`/api/pix/orders/${orderId}/notify`).catch(() => null);
            setMessage(r?.ok ? "Aviso registrado. Vamos conferir o recebimento." : r?.data.error || "Não foi possível registrar agora.");
            if (r?.ok) router.refresh();
            setBusy(false);
          }}>Já fiz o Pix</button>
        ) : null}
      </div>
      <p role="status" className="as-muted" hidden={!message}>{message}</p>
    </div>
  );
}
