"use client";
import { useState } from "react";
type Task = { id: string; title: string; date: string; done: boolean };
export default function Schedule({ initial }: { initial: Task[] }) {
  const [tasks, setTasks] = useState(initial),
    [error, E] = useState(""),
    [busy, B] = useState(false);
  async function save(method: string, body: unknown) {
    E("");
    B(true);
    try {
      const r = await fetch("/api/study", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setTasks(data.tasks);
      return true;
    } catch (e) {
      E(e instanceof Error ? e.message : "Falha ao salvar.");
      return false;
    } finally {
      B(false);
    }
  }
  return (
    <>
      <form
        className="admin-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget,
            d = new FormData(form);
          if (
            await save("POST", { title: d.get("title"), date: d.get("date") })
          )
            form.reset();
        }}
      >
        <label className="field">
          O que você vai estudar?
          <input
            name="title"
            maxLength={180}
            required
            placeholder="Ex.: revisar interpretação de texto"
          />
        </label>
        <label className="field">
          Data
          <input name="date" type="date" required />
        </label>
        <button disabled={busy} className="button primary">
          Adicionar etapa
        </button>
      </form>
      <p role="status" className="error">
        {error}
      </p>
      <ul className="task-list">
        {tasks.map((t) => (
          <li key={t.id}>
            <input
              type="checkbox"
              checked={t.done}
              aria-label={`Concluir ${t.title}`}
              disabled={busy}
              onChange={() => save("PATCH", { id: t.id, done: !t.done })}
            />
            <span>
              {t.title}
              <br />
              <small>{t.date.split("-").reverse().join("/")}</small>
            </span>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => save("DELETE", { id: t.id })}
              aria-label={`Excluir ${t.title}`}
            >
              Excluir
            </button>
          </li>
        ))}
      </ul>
      {!tasks.length && (
        <p>
          Seu cronograma começa com uma pequena etapa. Adicione a primeira
          acima.
        </p>
      )}
    </>
  );
}
