"use client";

import { useState } from "react";

/**
 * "Enviar para meu responsável pagar": compartilha o link público da landing (nunca dados do aluno).
 * Usa o compartilhamento nativo quando existe e cai para WhatsApp; copiar o link é o último recurso.
 */
export default function GuardianShare({ plan, name, total }: { plan: "essencial" | "premium"; name: string; total: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = `${window.location.origin}/landing#ofertas`;
    const text = `Oi! Quero estudar com o plano ${name} da GoDev Education (${total}, pagamento único, 7 dias de garantia). Você consegue pagar pelo link?`;
    try {
      if (navigator.share) { await navigator.share({ title: "GoDev Education", text, url }); return; }
    } catch { return; }
    const wa = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
    const opened = window.open(wa, "_blank", "noopener,noreferrer");
    if (!opened) {
      try { await navigator.clipboard.writeText(`${text} ${url}`); setCopied(true); setTimeout(() => setCopied(false), 3000); } catch { /* sem permissão: nada a fazer */ }
    }
  }
  return (
    <button type="button" className="s-guardian" onClick={share} data-analytics-event={`guardian_share_${plan}`}>
      {copied ? "Link copiado. Cole na conversa." : "Enviar para meu responsável pagar"}
    </button>
  );
}
