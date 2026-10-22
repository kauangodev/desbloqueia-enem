"use client";
import { useState } from "react";
type RecordData = Record<string, string | number | boolean | null | string[]>;
export default function AdminEditor({
  action,
  initial,
  title,
}: {
  action: string;
  initial: RecordData;
  title: string;
}) {
  const [value, V] = useState(initial),
    [msg, M] = useState(""),
    [busy, B] = useState(false);
  const labels: Record<string, string> = {
    id: "Identificador",
    name: "Nome",
    description: "Descrição",
    price_cents: "Preço em centavos",
    features: "Itens incluídos (um por linha)",
    plan: "Plano",
    cakto_product_id: "ID do produto Cakto",
    cakto_offer_id: "ID da oferta Cakto",
    checkout_url: "URL do checkout",
    enabled: "Ativar",
    title: "Título",
    category: "Categoria",
    pages: "Número de páginas",
    cover: "Caminho da capa",
    storage_path: "Arquivo privado",
    published: "Publicado",
    downloadable: "Permitir download",
    public_sample_url: "Amostra pública autorizada (caminho local)",
    email: "E-mail de atendimento",
    whatsapp: "WhatsApp com país e DDD (somente números)",
    message: "Mensagem inicial",
    hours: "Horário de atendimento",
    legal_name: "Razão social / responsável",
    legal_document: "CPF/CNPJ do responsável",
  };
  async function upload(file: File) {
    B(true);
    M("Enviando PDF…");
    try {
      if (file.type !== "application/pdf" || file.size > 50 * 1024 * 1024)
        throw new Error("Envie um PDF de até 50 MB.");
      if ((await file.slice(0, 5).text()) !== "%PDF-")
        throw new Error("O arquivo não tem formato PDF.");
      const r = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upload" }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      const sent = await fetch(data.signedUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      if (!sent.ok) throw new Error("Upload falhou. Tente novamente.");
      V((v) => ({ ...v, storage_path: data.path }));
      M("Arquivo enviado. Salve o material para concluir.");
    } catch (e) {
      M(e instanceof Error ? e.message : "Falha no upload.");
    } finally {
      B(false);
    }
  }
  return (
    <form
      className="admin-form"
      onSubmit={async (e) => {
        e.preventDefault();
        B(true);
        M("");
        try {
          const r = await fetch("/api/admin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, data: value }),
          });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error);
          M("Salvo com sucesso.");
        } catch (e) {
          M(e instanceof Error ? e.message : "Falha ao salvar.");
        } finally {
          B(false);
        }
      }}
    >
      <h3>{title}</h3>
      {Object.entries(value).map(([key, val]) => (
        <label className="field" key={key}>
          {labels[key] || key}
          {typeof val === "boolean" ? (
            <input
              type="checkbox"
              checked={val}
              onChange={(e) => V({ ...value, [key]: e.target.checked })}
            />
          ) : Array.isArray(val) ? (
            <textarea
              value={val.join("\n")}
              onChange={(e) =>
                V({ ...value, [key]: e.target.value.split("\n") })
              }
            />
          ) : key === "plan" ? (
            <select
              value={String(val)}
              onChange={(e) => V({ ...value, [key]: e.target.value })}
            >
              <option value="essencial">Essencial</option>
              <option value="premium">Premium</option>
            </select>
          ) : key === "category" ? (
            <select
              value={String(val)}
              onChange={(e) => V({ ...value, [key]: e.target.value })}
            >
              {[
                "Cronograma",
                "Linguagens",
                "Humanas",
                "Natureza",
                "Matemática",
                "Simulados",
                "Exercícios",
                "Redação",
                "Checklists",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          ) : (
            <input
              value={val === null ? "" : String(val)}
              type={typeof val === "number" ? "number" : "text"}
              readOnly={key === "storage_path"}
              onChange={(e) =>
                V({
                  ...value,
                  [key]:
                    typeof val === "number"
                      ? Number(e.target.value)
                      : e.target.value ||
                        ([
                          "cakto_product_id",
                          "cakto_offer_id",
                          "checkout_url",
                          "storage_path",
                          "public_sample_url",
                        ].includes(key)
                          ? null
                          : ""),
                })
              }
            />
          )}
        </label>
      ))}
      {action === "material" && (
        <label className="field">
          Enviar ou substituir PDF
          <input
            type="file"
            accept="application/pdf"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
            }}
          />
        </label>
      )}
      <button disabled={busy} className="button primary">
        {busy
          ? "Aguarde…"
          : action === "resend"
            ? "Reenfileirar instruções"
            : "Salvar alterações"}
      </button>
      <p role="status">{msg}</p>
    </form>
  );
}
