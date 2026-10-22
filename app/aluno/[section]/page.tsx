import { notFound } from "next/navigation";
import { identity, canAccess } from "../../../lib/supabase";
import Resources from "../../../components/resources";
import Library from "../../../components/library";
import Schedule from "../../../components/schedule";
import Support from "../../../components/support";
import Link from "next/link";
import { readFile } from "node:fs/promises";
import path from "node:path";
const sections: Record<string, [string, string]> = {
  materiais: ["Meus materiais", "Sua coleção, organizada por disciplina."],
  exercicios: [
    "Exercícios",
    "Pratique com os cadernos disponibilizados para seu plano.",
  ],
  simulados: ["Simulados", "Reserve um tempo e coloque a revisão em prática."],
  redacao: ["Redação", "Organize ideias, argumentos e repertório."],
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
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!sections[section]) notFound();
  const who = await identity();
  if (!who) return null;
  const [title, description] = sections[section];
  let content: React.ReactNode;
  const entitled = await canAccess(
    ["biblioteca", "simulados"].includes(section) ? "premium" : "essencial",
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
  else if (!entitled)
    content = (
      <div className="empty-state">
        <h2>
          {["biblioteca", "simulados"].includes(section)
            ? "Este conteúdo faz parte do Premium."
            : "Seu acesso ainda não está ativo."}
        </h2>
        <p>Os materiais são liberados após a confirmação da compra.</p>
        <Link className="button primary" href="/#planos">
          Ver planos
        </Link>
      </div>
    );
  else if (section === "biblioteca") {
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
    content = <Schedule initial={data || []} />;
  } else {
    let query = who.db.from("materials").select("*").eq("published", true);
    if (section === "exercicios") query = query.eq("category", "Exercícios");
    if (section === "simulados") query = query.eq("category", "Simulados");
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
