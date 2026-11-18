import Link from "next/link";
import "katex/dist/katex.min.css";
import RushPlayer from "../../../components/aluno/rush-player";
import { modules, toPublic } from "../../../lib/operacao/catalog";
import { questionsFor } from "../../../lib/planos/scope";
import { operacao } from "../../../lib/operacao/config";
import { operacaoUser } from "../../../lib/operacao/store";
import { disciplineLabel, type Discipline } from "../../../lib/operacao/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Treino rápido | GoDev Education" };

const BATCH = 5;
const disciplines: Discipline[] = ["matematica", "fisica", "quimica", "biologia"];

function shuffle<T>(list: T[]) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default async function RushPage({ searchParams }: { searchParams?: Promise<{ d?: string }> }) {
  const params = (await searchParams) || {};
  const user = await operacaoUser();
  if (!user) {
    return (
      <div className="as-page">
        <header className="as-head"><div><h1>Treino rápido</h1><p>Questões em sequência, com tempo por questão.</p></div></header>
        <section className="as-empty"><h2>Este treino faz parte do seu plano</h2><p className="as-muted">Ative um plano para praticar. Se você já pagou, fale com o atendimento.</p><Link className="as-btn as-btn-primary" href="/aluno/planos">Ver planos</Link></section>
      </div>
    );
  }
  const filter = disciplines.find((d) => d === params.d);
  let seen = new Set<string>();
  let failed = false;
  try { seen = new Set((await user.kv.list("attempt")).map((row) => row.ref)); } catch { failed = true; }
  const pool = questionsFor(user).filter((q) => !filter || q.discipline === filter);
  const unseen = pool.filter((q) => !seen.has(q.id));
  // Prioriza questões ainda não respondidas; se acabarem, completa com as já vistas.
  const picked = [...shuffle(unseen), ...shuffle(pool.filter((q) => seen.has(q.id)))].slice(0, BATCH);
  const titles = Object.fromEntries(modules.map((m) => [m.id, m.title]));

  return (
    <div className="as-page">
      <header className="as-head">
        <div><h1>Treino rápido</h1><p>{BATCH} questões por vez, sem pressa e com o tempo de cada uma. XP só vale na 1ª tentativa.</p></div>
        <span className="as-tag">{unseen.length} ainda não respondidas{filter ? ` em ${disciplineLabel[filter]}` : ""}</span>
      </header>
      <nav className="op-chips" aria-label="Disciplina" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Link className="as-btn" aria-current={!filter ? "page" : undefined} href="/aluno/treino-rapido">Todas</Link>
        {disciplines.map((d) => <Link key={d} className="as-btn" aria-current={filter === d ? "page" : undefined} href={`/aluno/treino-rapido?d=${d}`}>{disciplineLabel[d]}</Link>)}
      </nav>
      {failed ? <p className="op-error" role="alert">Não foi possível carregar seu histórico. Você ainda pode treinar.</p> : null}
      {picked.length ? (
        <RushPlayer key={picked.map((q) => q.id).join("|")} questions={picked.map(toPublic)} moduleTitles={titles} basePath={operacao.basePath} />
      ) : (
        <section className="as-empty"><h2>Sem questões nesta seleção</h2><p className="as-muted">Escolha outra disciplina.</p></section>
      )}
    </div>
  );
}
