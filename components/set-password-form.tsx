"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetPasswordForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form className="form-card" onSubmit={async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const password = String(data.get("password") || "");
      const confirmation = String(data.get("confirmation") || "");
      if (password.length < 8) return setMessage("Use pelo menos 8 caracteres.");
      if (password !== confirmation) return setMessage("As senhas não coincidem.");
      setBusy(true); setMessage("");
      const token = new URLSearchParams(window.location.search).get("token") || "";
      const redirect = new URLSearchParams(window.location.search).get("redirect") || "";
      const response = await fetch("/api/auth/reset", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, password, redirect }) });
      const result = await response.json().catch(() => ({}));
      setBusy(false);
      if (!response.ok) return setMessage(result.error || "Não foi possível salvar sua senha agora. Tente novamente.");
      router.push(result.redirect || "/aluno");
    }}>
      <label className="field">Nova senha<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
      <label className="field">Confirmar senha<input name="confirmation" type="password" autoComplete="new-password" minLength={8} required /></label>
      <button className="button primary" disabled={busy}>{busy ? "Salvando…" : "Salvar senha"}</button>
      <p role="alert" className="status-message" hidden={!message}>{message}</p>
    </form>
  );
}

