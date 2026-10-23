"use client";
import { useState } from "react";
export default function LoginForm({ configured }: { configured: boolean }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        const data = new FormData(e.currentTarget);
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: data.get("email") }),
          });
          const result = await res.json();
          setMessage(result.message || result.error);
        } catch {
          setMessage("Não foi possível conectar. Tente novamente.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field">
        Seu e-mail de compra
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="voce@exemplo.com"
          maxLength={254}
        />
      </label>
      <button className="button primary" disabled={!configured || busy}>
        {busy ? "Enviando…" : "Receber link de acesso"}
      </button>
      <p role="status" className="status-message" hidden={!message}>
        {message}
      </p>
      {!configured && (
        <p className="status-message">
          O acesso por e-mail está em preparação. Volte aqui quando as vendas
          forem abertas.
        </p>
      )}
      <p className="subtle">
        Use o mesmo e-mail informado na Cakto. Sem senha para memorizar: o link
        é pessoal, comprova que o e-mail é seu e tem validade limitada.
      </p>
    </form>
  );
}
