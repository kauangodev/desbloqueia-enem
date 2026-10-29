"use client";

import { useState } from "react";

export default function DeleteUserButton({ userId, email }: { userId: string; email: string }) {
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm(`Excluir permanentemente a conta de ${email}? O histórico financeiro será preservado, mas o acesso será removido.`)) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_user", data: { userId } }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Não foi possível excluir a conta.");
      window.location.reload();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível excluir a conta.");
    } finally {
      setBusy(false);
    }
  }

  return <button className="button danger-button" type="button" onClick={() => void remove()} disabled={busy}>{busy ? "Excluindo…" : "Excluir conta"}</button>;
}

