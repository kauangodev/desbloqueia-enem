"use client";
import { useEffect, useRef, useState } from "react";
import { ApiError, post } from "./client";

export default function ReadToggle({ moduleId, initial }: { moduleId: string; initial: boolean }) {
  const [done, setDone] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  useEffect(() => setDone(initial), [initial]);
  async function toggle() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    const next = !done;
    try { await post({ action: "read", moduleId, concluded: next }); setDone(next); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Não foi possível salvar. Tente novamente."); }
    finally { lock.current = false; setBusy(false); }
  }
  return (
    <div className="op-read">
      <button type="button" className={`op-btn ${done ? "" : "op-btn-primary"}`} aria-pressed={done} disabled={busy} onClick={toggle} data-analytics-event="operacao_module_read">{done ? "Leitura concluída ✓ (desfazer)" : "Marcar como lido"}</button>
      {error ? <p className="op-error" role="alert">{error}</p> : null}
    </div>
  );
}
