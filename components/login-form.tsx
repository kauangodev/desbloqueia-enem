"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { features } from "../lib/features";
export default function LoginForm({ configured, redirect, initialMode = "login" }: { configured: boolean; redirect?: string; initialMode?: "login" | "register" }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [isError, setIsError] = useState(false);
  const show = (text: string, error = false) => { setMessage(text); setIsError(error && Boolean(text)); };
  const [mode, setMode] = useState<"login" | "register">(initialMode === "register" && features.gratis ? "register" : "login");
  const router = useRouter();
  const googleErrors: Record<string, string> = {
    "google-sessao": "A sessão do Google expirou. Tente de novo.", "google-cancelado": "Entrada com Google cancelada.", "google-invalido": "Não foi possível validar a conta Google.",
    "google-indisponivel": "O login com Google está indisponível agora. Use o e-mail ou tente mais tarde.", "google-termos": "Para criar a conta com Google, aceite os termos na aba de cadastro.",
    "google-existente": "Já existe uma conta GoDev com este e-mail. Entre com e-mail e senha (ou recupere a senha) para continuar.", "google-conta": "Esta conta não pode entrar agora. Fale com o atendimento.",
  };
  const fromGoogle = useSearchParams().get("erro");
  const googleMessage = fromGoogle ? googleErrors[fromGoogle] : "";
  const startGoogle = () => {
    const form = document.querySelector("form") as HTMLFormElement;
    const data = new FormData(form);
    if (mode === "register" && data.get("acceptTerms") !== "on") { show("Para continuar com o Google, aceite os termos e a política de privacidade.", true); return; }
    const params = new URLSearchParams({ redirect: redirect || "/aluno" });
    if (mode === "register") { params.set("terms", "1"); if (data.get("marketing") === "on") params.set("marketing", "1"); }
    // Navegação completa (não SPA): a rota redireciona para o domínio do Google.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/api/auth/google/start?${params.toString()}`;
  };
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setMessage("");
        const data = new FormData(e.currentTarget);
        const password = String(data.get("password") || "");
        if (mode === "register" && password !== String(data.get("passwordConfirmation") || "")) {
          show("As senhas precisam ser iguais.", true);
          return;
        }
        setBusy(true);
        try {
          const payload = {
            email: data.get("email"),
            password,
            name: data.get("name"),
            redirect,
            acceptTerms: data.get("acceptTerms") === "on",
            marketing: data.get("marketing") === "on",
          };
          const res = await fetch(mode === "register" ? "/api/auth/register" : "/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const result = await res.json();
          if (result.redirect) router.push(result.redirect);
          show(result.message || result.error, !res.ok || Boolean(result.error));
        } catch {
          show("Não foi possível conectar. Tente novamente.", true);
        } finally {
          setBusy(false);
        }
      }}
    >
      {mode === "register" && (
        <label className="field">
          Seu nome
          <input name="name" type="text" autoComplete="name" maxLength={120} placeholder="Seu nome" />
        </label>
      )}
      <label className="field">
        {mode === "register" ? "Seu e-mail" : features.gratis ? "Seu e-mail" : "Seu e-mail de compra"}
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={isError || undefined}
          aria-describedby={message ? "form-message" : undefined}
          placeholder="voce@exemplo.com"
          maxLength={254}
        />
      </label>
      <label className="field">
        Sua senha
        <input
          name="password"
          type="password"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          required
          minLength={8}
          placeholder="••••••••"
        />
      </label>
      {mode === "register" && (
        <label className="field">
          Confirme sua senha
          <input name="passwordConfirmation" type="password" autoComplete="new-password" required minLength={8} placeholder="Repita sua senha" />
        </label>
      )}
      {mode === "register" && features.gratis && (
        <>
          <label className="field" style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
            <input name="acceptTerms" type="checkbox" required style={{ width: 24, height: 24, flex: "none" }} />
            <span>Li e aceito os <Link href="/politicas/termos">termos de uso</Link> e a <Link href="/politicas/privacidade">política de privacidade</Link>.</span>
          </label>
          <label className="field" style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
            <input name="marketing" type="checkbox" style={{ width: 24, height: 24, flex: "none" }} />
            <span>Quero receber novidades e dicas de estudo por e-mail (opcional).</span>
          </label>
        </>
      )}
      {features.gratis && features.google ? (
        <button type="button" className="button secondary" disabled={!configured || busy} onClick={startGoogle}>Continuar com Google</button>
      ) : null}
      <p role="alert" className="status-message error" hidden={!googleMessage}>{googleMessage}</p>
      <button className="button primary" disabled={!configured || busy}>
        {busy ? "Aguarde…" : mode === "register" ? "Criar meu cadastro" : "Entrar na área de alunos"}
      </button>
      <p id="form-message" role={isError ? "alert" : "status"} className={"status-message" + (isError ? " error" : "")} hidden={!message}>
        {isError ? <strong>Erro: </strong> : null}{message}
      </p>
      {!configured && (
        <p className="status-message">
          O acesso por e-mail está em preparação. Volte aqui quando as vendas
          forem abertas.
        </p>
      )}
      {mode === "login" && <button
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
            show(result.message || result.error, !res.ok || Boolean(result.error));
          } catch {
            show("Não foi possível solicitar a configuração da senha.", true);
          } finally {
            setBusy(false);
          }
        }}
      >
        Primeiro acesso ou esqueci a senha
      </button>}
      <button
        type="button"
        className="button secondary"
        disabled={!configured || busy}
        onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}
      >
        {mode === "login" ? "Ainda não tenho cadastro" : "Já tenho cadastro"}
      </button>
      <p className="subtle">
        {mode === "register"
          ? (features.gratis ? "Crie sua conta grátis, sem cartão. Enviamos um link para confirmar seu e-mail e criar sua senha." : "Use o mesmo e-mail aprovado na Cakto. O cadastro é liberado automaticamente após a confirmação da compra ou de um convite administrativo.")
          : (features.gratis ? "Entre com o e-mail e a senha da sua conta." : "Use o mesmo e-mail aprovado na Cakto e a senha criada no cadastro.")
        }
      </p>
    </form>
  );
}


