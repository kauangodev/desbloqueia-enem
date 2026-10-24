"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "../lib/supabase-browser";

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
      const { error } = await browserClient().auth.updateUser({ password });
      setBusy(false);
      if (error) return setMessage("Este link expirou. Solicite uma nova configuração de senha.");
      router.push("/aluno");
    }}>
      <label className="field">Nova senha<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
      <label className="field">Confirmar senha<input name="confirmation" type="password" autoComplete="new-password" minLength={8} required /></label>
      <button className="button primary" disabled={busy}>{busy ? "Salvando…" : "Salvar senha"}</button>
      <p role="alert" className="status-message" hidden={!message}>{message}</p>
    </form>
  );
}
