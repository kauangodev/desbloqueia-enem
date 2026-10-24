"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function LoginForm({ configured }: { configured: boolean }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
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
            body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
          });
          const result = await res.json();
          if (result.redirect) router.push(result.redirect);
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
      <label className="field">
        Sua senha
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          placeholder="••••••••"
        />
      </label>
      <button className="button primary" disabled={!configured || busy}>
        {busy ? "Entrando…" : "Entrar na área de alunos"}
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
      <button
        type="button"
        className="button secondary"
        disabled={!configured || busy}
        onClick={async () => {
          const email = new FormData((document.querySelector("form") as HTMLFormElement)).get("email");
          setBusy(true);
          setMessage("");
          try {
            const res = await fetch("/api/auth/request-password", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            });
            const result = await res.json();
            setMessage(result.message || result.error);
          } catch {
            setMessage("Não foi possível solicitar a configuração da senha.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Primeiro acesso ou esqueci a senha
      </button>
      <p className="subtle">
        Use o mesmo e-mail aprovado na Cakto. A senha é criada uma vez pelo
        link de configuração e depois você entra normalmente.
      </p>
    </form>
  );
}
