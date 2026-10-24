"use client";
import { useState } from "react";

export default function SupportTicketForm() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, message }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível abrir o chamado.");
      setSubject("");
      setMessage("");
      setStatus("Chamado aberto. A equipe poderá acompanhar e responder pelo atendimento.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Não foi possível abrir o chamado.");
    } finally {
      setBusy(false);
    }
  }
  return <form className="ticket-form" onSubmit={submit}>
    <div><span className="eyebrow">Atendimento interno</span><h3>Precisa de ajuda?</h3><p>Abra um chamado e acompanhe a resolução pela equipe.</p></div>
    <label className="field">Assunto<input required minLength={3} maxLength={140} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Ex.: Não consigo abrir um material" /></label>
    <label className="field">Descreva o que aconteceu<textarea required minLength={10} maxLength={4000} rows={5} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Conte os detalhes para conseguirmos ajudar." /></label>
    <div className="ticket-actions"><button className="button primary" disabled={busy}>{busy ? "Abrindo chamado…" : "Abrir chamado"}</button><span className="subtle" role="status">{status}</span></div>
  </form>;
}

