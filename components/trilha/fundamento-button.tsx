"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { post } from "./client";

/** "Marcar como visto": o fundamento só conta com ação explícita do aluno (e usa o mesmo evento de leitura do módulo). */
export default function FundamentoButton({ unitId, done }: { unitId: string; done: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (done) return <span className="tr-done">Fundamento visto</span>;
  async function mark() {
    if (busy) return;
    setBusy(true); setError("");
    try { await post({ action: "fundamento", unitId }); router.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Não foi possível salvar."); }
    finally { setBusy(false); }
  }
  return (
    <span className="tr-inline">
      <button type="button" className="as-btn" disabled={busy} onClick={mark}>{busy ? "Salvando…" : "Marcar como visto"}</button>
      {error ? <span className="op-error" role="alert">{error}</span> : null}
    </span>
  );
}
