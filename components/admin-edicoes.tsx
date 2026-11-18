import { editions } from "../data/edicoes";
import { calendarNote, editionState, formatDate, validateEdition } from "../lib/edicoes/model";
import { todayInSaoPaulo } from "../lib/operacao/config";

const kindLabel = { inscricao: "Inscrição", "prova-dia-1": "1º dia de prova", "prova-dia-2": "2º dia de prova", gabarito: "Gabarito", resultado: "Resultado", outro: "Outro" } as const;
const statusLabel = { ativa: "Ativa", arquivada: "Arquivada", rascunho: "Rascunho" } as const;

/** Edições e calendário do ENEM (somente leitura). A publicação hoje é por revisão do repositório (`data/edicoes.ts`). */
export default function AdminEdicoes() {
  const today = todayInSaoPaulo();
  return (
    <div className="op-stack">
      <p className="status-message" role="note">Somente leitura. Edições e datas são versionadas em <code>data/edicoes.ts</code> e publicadas por revisão do repositório. A edição e a ativação pelo painel, com prévia e histórico, ainda não existem.</p>
      {editions.map((edition) => {
        const state = editionState(edition, today);
        const note = calendarNote(edition, today);
        const problems = validateEdition(edition);
        return (
          <section key={edition.key} className="admin-card" aria-labelledby={`ed-${edition.key}`} style={{ padding: 16, marginBottom: 16 }}>
            <h2 id={`ed-${edition.key}`}>{edition.label} · {statusLabel[edition.status]}</h2>
            <p>{note.headline}. Fase hoje ({today.split("-").reverse().join("/")}): <strong>{state.phase === "preparacao" ? "preparação" : state.phase === "dia-de-prova" ? "dia de prova" : "pós-prova"}</strong>.{edition.publishedAt ? ` Publicada em ${edition.publishedAt.slice(0, 10).split("-").reverse().join("/")}.` : ""}</p>
            {edition.note ? <p>{edition.note}</p> : null}
            {problems.length ? <p className="status-message" role="alert">Problemas de validação: {problems.join("; ")}</p> : <p>Validação: sem problemas.</p>}
            <div className="table-wrap" tabIndex={0} role="region" aria-label={`Eventos da edição ${edition.label}`}>
              <table className="crm-table">
                <thead><tr><th scope="col">Evento</th><th scope="col">Tipo</th><th scope="col">Data</th><th scope="col">Estado</th><th scope="col">Fonte</th></tr></thead>
                <tbody>
                  {edition.events.map((event) => (
                    <tr key={event.key}>
                      <th scope="row">{event.label}</th>
                      <td>{kindLabel[event.kind]}</td>
                      <td>{event.date ? `${formatDate(event.date)}${event.time ? `, ${event.time}` : ""}` : "—"}</td>
                      <td>{event.status === "confirmado" ? "Confirmado" : "A confirmar"}</td>
                      <td>{event.sourceUrl ? <a href={event.sourceUrl} target="_blank" rel="noreferrer">Inep</a> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
