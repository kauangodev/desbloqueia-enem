"use client";

import { useState } from "react";

export default function ManualAccessForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [plan, setPlan] = useState("essencial");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "grant_access", data: { email, name, plan } }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível liberar o acesso.");
      setMessage("Acesso liberado. O comprador pode usar Primeiro acesso / Esqueci a senha.");
      setEmail("");
      setName("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível liberar o acesso.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="manual-access-form" onSubmit={submit}>
      <div>
        <span className="admin-eyebrow">Liberação excepcional</span>
        <h3>Conceder acesso manual</h3>
        <p>Use em compras já confirmadas, sorteios ou cortesias. A ação fica registrada no histórico.</p>
      </div>
      <label>E-mail do comprador<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>Nome (opcional)<input value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>Plano<select value={plan} onChange={(event) => setPlan(event.target.value)}><option value="essencial">Essencial</option><option value="premium">Premium</option></select></label>
      <button className="button primary" disabled={busy}>{busy ? "Liberando…" : "Liberar acesso"}</button>
      <p role="status">{message}</p>
    </form>
  );
}
