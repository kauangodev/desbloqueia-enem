import { notFound } from "next/navigation";
import { identity, canAccess } from "../../../lib/supabase";
import Resources from "../../../components/resources";
import Library from "../../../components/library";
import Schedule from "../../../components/schedule";
import Support from "../../../components/support";
import Link from "next/link";
import { readFile } from "node:fs/promises";
import path from "node:path";
import AssessmentPlayer from "../../../components/assessment-player";
import { questionsFor } from "../../../data/question-bank";
const sections: Record<string, [string, string]> = {
  materiais: ["Meus materiais", "Sua coleção, organizada por disciplina."],
  exercicios: [
    "Exercícios",
    "Pratique com os cadernos disponibilizados para seu plano.",
  ],
  simulados: ["Simulados", "Reserve um tempo e coloque a revisão em prática."],
  redacao: ["Redação", "Organize ideias, argumentos e repertório."],
  checklists: ["Fichas e checklists", "Revise seus pontos de atenção antes da prova."],
  correcoes: ["Minhas correções", "Retome seus erros e transforme cada um em próximo passo."],
  cronograma: [
    "Meu cronograma",
    "Pequenas etapas. Uma rotina que faz sentido para você.",
  ],
  biblioteca: [
    "Biblioteca histórica do ENEM",
    "Explore as provas de 2016 a 2025.",
  ],
  conta: ["Minha conta", "Seus dados e acessos."],
  suporte: ["Atendimento", "Encontre os canais oficiais de suporte."],
};
export default async function Section({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams?: Promise<{ simulado?: string }>;
}) {
  const { section } = await params;
  const search = (await searchParams) || {};
  if (!sections[section]) notFound();
  const who = await identity();
  if (!who) return null;
  const [title, description] = sections[section];
  let content: React.ReactNode;
  const entitled = await canAccess(
    ["biblioteca", "simulados", "checklists"].includes(section) ? "premium" : "essencial",
  );
  if (section === "conta") {
    const { data } = await who.db
      .from("entitlements")
      .select("plan,active,order_id")
      .eq("user_id", who.user.id);
    content = (
      <div className="empty-state">
        <p>
          <b>E-mail:</b> {who.user.email}
        </p>
        <p>
          <b>Nome:</b> {who.profile?.name || "Não informado"}
        </p>
        <h2>Seus acessos</h2>
        {data?.length ? (
          data.map((e) => (
            <p key={e.order_id}>
              {e.plan === "premium" ? "Premium" : "Essencial"} ·{" "}
              {e.active ? "Ativo" : "Revogado"}
            </p>
          ))
        ) : (
          <p>Nenhuma compra vinculada.</p>
        )}
        <p>
          Para recuperar o acesso, solicite um novo link em Entrar. Pedidos de
          correção de dados podem ser enviados ao atendimento.
        </p>
      </div>
    );
  } else if (section === "suporte") content = <Support />;
  else if (section === "correcoes")
    content = (
      <div className="empty-state correction-empty">
        <span className="eyebrow">Seu histórico</span>
        <h2>Suas correções aparecerão aqui</h2>
        <p>Finalize um exercício ou simulado para acompanhar acertos por área, pontos de atenção e recomendações personalizadas.</p>
        <Link className="button primary" href="/aluno/exercicios">Começar exercícios</Link>
      </div>
    );
  else if (!entitled)
    content = (
      <div className="empty-state">
        <h2>
          {["biblioteca", "simulados", "checklists"].includes(section)
            ? "Este conteúdo faz parte do Premium."
            : "Seu acesso ainda não está ativo."}
        </h2>
        <p>Os materiais são liberados após a confirmação da compra.</p>
        <Link className="button primary" href="/#planos">
          Ver planos
        </Link>
      </div>
    );
  else if (section === "exercicios") {
    content = <AssessmentPlayer questions={questionsFor("exercicios")} title="Exercícios de base" subtitle="Resolva no seu ritmo e descubra onde concentrar energia na próxima revisão." />;
  } else if (section === "simulados") {
    const activity = search.simulado === "2" ? "simulado-2" : "simulado-1";
    content = <><div className="assessment-switcher"><Link className={activity === "simulado-1" ? "active" : ""} href="/aluno/simulados?simulado=1">Simulado 1 · Humanas + Linguagens</Link><Link className={activity === "simulado-2" ? "active" : ""} href="/aluno/simulados?simulado=2">Simulado 2 · Natureza + Matemática</Link></div><AssessmentPlayer questions={questionsFor(activity)} title={activity === "simulado-1" ? "Simulado 1" : "Simulado 2"} subtitle="Resolva todas as questões. A correção detalhada aparece ao finalizar." /></>;
  } else if (section === "biblioteca") {
    const entries = JSON.parse(
      await readFile(path.join(process.cwd(), "data/library.json"), "utf8"),
    );
    content = <Library entries={entries} />;
  } else if (section === "cronograma") {
    const { data } = await who.db
      .from("study_progress")
      .select("*")
      .eq("user_id", who.user.id)
      .order("date");
    const { data: guides } = await who.db.from("materials").select("*").eq("published", true).eq("category", "Cronograma");
    content = <><Schedule initial={data || []} /><h2>Guias para organizar a revisão</h2><Resources items={guides || []} /></>;
  } else {
    let query = who.db.from("materials").select("*").eq("published", true);
    if (section === "exercicios") query = query.eq("category", "Exercícios");
    if (section === "simulados") query = query.eq("category", "Simulados");
    if (section === "checklists") query = query.eq("category", "Checklists");
    if (section === "redacao")
      query = query.in("category", ["Redação", "Linguagens"]);
    const { data } = await query;
    content = <Resources items={data || []} />;
  }
  return (
    <>
      <h1 className="page-title">{title}</h1>
      <p>{description}</p>
      {content}
    </>
  );
}
