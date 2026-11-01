"use client";

import { useState } from "react";

export default function ManualAccessForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [plan, setPlan] = useState("essencial");
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"success" | "error" | "">("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setMessageKind("");
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "grant_access", data: { email, name, plan } }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível liberar o acesso.");
      setMessage("Acesso liberado. O comprador pode usar Primeiro acesso / Esqueci a senha.");
      setMessageKind("success");
      setEmail("");
      setName("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível liberar o acesso.");
      setMessageKind("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="manual-access-form" onSubmit={submit} aria-busy={busy}>
      <div>
        <span className="admin-eyebrow">Liberação excepcional</span>
        <h3>Conceder acesso manual</h3>
        <p>Use em compras já confirmadas, sorteios ou cortesias. A ação fica registrada no histórico.</p>
      </div>
      <label>E-mail do comprador<input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>Nome (opcional)<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>Plano<select value={plan} onChange={(event) => setPlan(event.target.value)}><option value="essencial">Essencial</option><option value="premium">Premium</option></select></label>
      <button className="button primary" disabled={busy}>{busy ? "Liberando…" : "Liberar acesso"}</button>
      <p className={`manual-access-message ${messageKind}`} role={messageKind === "error" ? "alert" : "status"} aria-live="polite" hidden={!message}>{message}</p>
    </form>
  );
}

