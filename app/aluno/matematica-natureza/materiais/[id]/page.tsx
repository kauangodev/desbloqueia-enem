import Link from "next/link";
import { notFound } from "next/navigation";
import ReadToggle from "../../../../../components/operacao/read-toggle";
import { moduleById, modules, questions } from "../../../../../lib/operacao/catalog";
import { operacao } from "../../../../../lib/operacao/config";
import { renderInline, renderRich } from "../../../../../lib/operacao/rich";
import { operacaoUser } from "../../../../../lib/operacao/store";
import { disciplineLabel } from "../../../../../lib/operacao/types";

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = moduleById(id);
  if (!m) notFound();
  const user = await operacaoUser();
  let concluded = false;
  try { concluded = Boolean((await user!.kv.get<{ concluded: boolean }>("read", m.id))?.concluded); } catch { /* o botão informa falha ao salvar */ }
  const base = operacao.basePath;
  const next = modules[modules.findIndex((x) => x.id === m.id) + 1];
  const related = questions.filter((q) => q.moduleId === m.id).length;
  return (
    <article className="op-stack op-module">
      <p><Link className="op-link" href={`${base}/materiais`}>← Materiais</Link></p>
      <header className="op-card">
        <span className="op-tag">{disciplineLabel[m.discipline]}</span>
        <h2>{m.title}</h2>
        <p className="op-lead">{m.objective}</p>
        <p className="op-muted">Tempo: ≈ {m.minutes} min · Pré-requisitos: {m.prerequisites.length ? m.prerequisites.join("; ") : "nenhum"}</p>
      </header>
      <section className="op-card"><h3>Conceito</h3><div className="op-rich" dangerouslySetInnerHTML={{ __html: renderRich(m.concept) }} /></section>
      <section className="op-card"><h3>Como o Enem cobra</h3><div className="op-rich" dangerouslySetInnerHTML={{ __html: renderRich(m.situations) }} /></section>
      <section className="op-card">
        <h3>Fórmulas e relações</h3>
        <ul className="op-formulas">
          {m.formulas.map((f) => (
            <li key={f.tex}><div className="op-tex" dangerouslySetInnerHTML={{ __html: renderRich(`$$${f.tex}$$`) }} /><p>{f.meaning}{f.conditions ? <span className="op-muted"> — {f.conditions}</span> : null}</p></li>
          ))}
        </ul>
      </section>
      <section className="op-card">
        <h3>Exemplos resolvidos</h3>
        {m.examples.map((e) => (
          <div key={e.title} className="op-example">
            <h4>{e.title}</h4>
            <div className="op-rich" dangerouslySetInnerHTML={{ __html: renderRich(e.problem) }} />
            <details><summary>Ver resolução</summary><div className="op-rich" dangerouslySetInnerHTML={{ __html: renderRich(e.solution) }} /></details>
          </div>
        ))}
      </section>
      <section className="op-card"><h3>Erros comuns</h3><ul>{m.commonErrors.map((e) => <li key={e} dangerouslySetInnerHTML={{ __html: renderInline(e) }} />)}</ul></section>
      <section className="op-card"><h3>Resumo</h3><ul>{m.summary.map((e) => <li key={e} dangerouslySetInnerHTML={{ __html: renderInline(e) }} />)}</ul></section>
      <section className="op-card">
        <h3>Revisão ativa</h3>
        <p className="op-muted">Tente responder antes de abrir.</p>
        {m.recall.map((r) => <details key={r.q} className="op-recall"><summary dangerouslySetInnerHTML={{ __html: renderInline(r.q) }} /><p dangerouslySetInnerHTML={{ __html: renderInline(r.a) }} /></details>)}
      </section>
      <section className="op-card">
        <h3>Questões relacionadas</h3>
        {related ? <Link className="op-btn op-btn-primary" href={`${base}/questoes?m=${m.id}`} data-analytics-event="operacao_module_practice">Praticar {related} questões deste módulo</Link> : <p className="op-muted">Ainda não há questões vinculadas a este módulo.</p>}
      </section>
      <section className="op-card op-fine">
        <h3>Fontes e revisão</h3>
        <ul>{m.sources.map((s) => <li key={s.label}>{s.url ? <a href={s.url} target="_blank" rel="noreferrer noopener">{s.label}</a> : s.label}</li>)}</ul>
        <p className="op-muted">Última revisão editorial: {new Date(`${m.reviewedAt}T12:00:00`).toLocaleDateString("pt-BR")}. Revisão por professor da disciplina: pendente.</p>
      </section>
      <div className="op-pager">
        <ReadToggle moduleId={m.id} initial={concluded} />
        {next ? <Link className="op-btn" href={`${base}/materiais/${next.id}`}>Próximo: {next.title}</Link> : null}
      </div>
    </article>
  );
}
