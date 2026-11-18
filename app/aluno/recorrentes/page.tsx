import Link from "next/link";
import { questions, toMeta } from "../../../lib/operacao/catalog";
import { operacao } from "../../../lib/operacao/config";
import { recorrentes } from "../../../lib/aluno/recorrentes";
import { disciplineLabel } from "../../../lib/operacao/types";

export const metadata = { title: "Tópicos recorrentes | GoDev Education" };

export default function RecorrentesPage() {
  const resumo = recorrentes(questions.map(toMeta));
  return (
    <div className="as-page">
      <header className="as-head">
        <div>
          <h1>Tópicos recorrentes</h1>
          <p>Assuntos que aparecem nas questões oficiais do Enem que temos no acervo, com atalho para treinar cada um.</p>
        </div>
      </header>
      <p className="op-note" role="note">
        Amostra pequena: {resumo.officialTotal} {resumo.officialTotal === 1 ? "questão oficial" : "questões oficiais"} de {resumo.years.length ? resumo.years.join(" e ") : "nenhum ano"}, só de Matemática e Ciências da Natureza. Isto mostra onde o acervo já viu cada assunto; <strong>não é uma previsão</strong> do que cairá no Enem 2027. Linguagens, Humanas e outros anos entram quando houver questões oficiais cadastradas.
      </p>
      {resumo.rows.length ? (
        <section className="as-card" aria-labelledby="rec-h">
          <h2 id="rec-h">Por tópico</h2>
          <ul className="as-list">
            {resumo.rows.map((row) => (
              <li key={`${row.discipline}-${row.topic}`}>
                <span>
                  <strong>{row.topic}</strong>
                  <br />
                  <small className="as-muted">{disciplineLabel[row.discipline]} · {row.official} {row.official === 1 ? "oficial" : "oficiais"} ({row.years.join(", ")}) · {row.authorial} autorais para treinar</small>
                </span>
                <span className="as-links">
                  <Link className="op-link" href={`${operacao.basePath}/questoes?d=${row.discipline}&t=${encodeURIComponent(row.topic)}`}>Treinar</Link>
                  <Link className="op-link" href={`${operacao.basePath}/materiais/${row.moduleId}`}>Rever o conteúdo</Link>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="as-empty"><h2>Sem questões oficiais cadastradas</h2><p className="as-muted">Quando houver, os tópicos aparecem aqui.</p></section>
      )}
    </div>
  );
}
