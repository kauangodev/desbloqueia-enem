import Link from "next/link";
import { modules, questions } from "../../../../lib/operacao/catalog";
import { operacao } from "../../../../lib/operacao/config";
import { operacaoUser } from "../../../../lib/operacao/store";
import { disciplineLabel, type Discipline } from "../../../../lib/operacao/types";

export const metadata = { title: "Materiais — Operação 2º Domingo" };

export default async function Materials({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d } = await searchParams;
  const filter = (["matematica", "fisica", "quimica", "biologia"] as string[]).includes(d || "") ? (d as Discipline) : undefined;
  const user = await operacaoUser();
  let reads = new Set<string>();
  let failed = false;
  try {
    reads = new Set((await user!.kv.list<{ concluded: boolean }>("read")).filter((r) => r.data.concluded).map((r) => r.ref));
  } catch { failed = true; }
  const base = operacao.basePath;
  const list = modules.filter((m) => !filter || m.discipline === filter);
  return (
    <div className="op-stack">
      <nav className="op-chips" aria-label="Filtrar por disciplina">
        <Link href={`${base}/materiais`} aria-current={!filter ? "true" : undefined}>Todas</Link>
        {(Object.keys(disciplineLabel) as Discipline[]).map((k) => <Link key={k} href={`${base}/materiais?d=${k}`} aria-current={filter === k ? "true" : undefined}>{disciplineLabel[k]}</Link>)}
      </nav>
      {failed ? <p className="op-error" role="alert">Não foi possível carregar quais módulos você já leu.</p> : null}
      <div className="op-grid op-grid-2">
        {list.map((m) => (
          <Link key={m.id} href={`${base}/materiais/${m.id}`} className="op-card op-module-card">
            <span className="op-tag">{disciplineLabel[m.discipline]}</span>
            <strong>{m.title}</strong>
            <span className="op-muted">{m.objective}</span>
            <span className="op-muted">{m.minutes} min · {questions.filter((q) => q.moduleId === m.id).length} questões · {reads.has(m.id) ? "lido ✓" : "não lido"}</span>
          </Link>
        ))}
      </div>
      {!list.length ? <p className="op-card op-empty">Nenhum módulo publicado nesta disciplina ainda.</p> : null}
      <p className="op-muted op-fine">{modules.length} módulos publicados. Módulos em produção só aparecem aqui depois de revisados.</p>
    </div>
  );
}
