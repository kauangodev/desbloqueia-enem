"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Ticket = { id: string; email: string; subject: string; message: string; status: "open" | "in_progress" | "resolved"; priority: "normal" | "high"; admin_note: string; created_at: string; updated_at: string };
const statusLabel = { open: "Aberto", in_progress: "Em andamento", resolved: "Resolvido" };
const formatDate = (value: string) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));

export default function TicketManager({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  async function update(ticket: Ticket, status: Ticket["status"]) {
    setBusy(ticket.id);
    setMessage("");
    try {
      const response = await fetch("/api/tickets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ticket.id, status, adminNote: ticket.admin_note }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível atualizar o chamado.");
      setMessage("Chamado atualizado.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar o chamado.");
    } finally {
      setBusy("");
    }
  }
  return <div className="ticket-manager">
    <div className="ticket-manager-heading"><div><span className="eyebrow">Fila de atendimento</span><h2>Chamados dos alunos</h2><p>Organize dúvidas, problemas de acesso e relatos de uso em um só lugar.</p></div><span className="crm-count">{tickets.length} chamado(s)</span></div>
    <p className="subtle" role="status">{message}</p>
    <div className="ticket-list">
      {tickets.map((ticket) => <article className="ticket-card" key={ticket.id}>
        <div className="ticket-card-head"><div><span className={`ticket-status ${ticket.status}`}>{statusLabel[ticket.status]}</span>{ticket.priority === "high" && <span className="ticket-priority">Prioridade alta</span>}<h3>{ticket.subject}</h3><a href={`mailto:${ticket.email}`}>{ticket.email}</a></div><time dateTime={ticket.created_at}>{formatDate(ticket.created_at)}</time></div>
        <p>{ticket.message}</p>
        {ticket.admin_note && <div className="ticket-note"><b>Nota interna:</b> {ticket.admin_note}</div>}
        <div className="ticket-actions"><span className="subtle">Atualizado em {formatDate(ticket.updated_at)}</span><div><button className="button secondary" disabled={busy === ticket.id || ticket.status === "in_progress"} onClick={() => update(ticket, "in_progress")}>Assumir</button><button className="button primary" disabled={busy === ticket.id || ticket.status === "resolved"} onClick={() => update(ticket, "resolved")}>Resolver</button></div></div>
      </article>)}
      {!tickets.length && <div className="empty-state"><h3>Nenhum chamado aberto</h3><p>Quando um aluno enviar uma reclamação ou dúvida, ela aparecerá aqui.</p></div>}
    </div>
  </div>;
}

