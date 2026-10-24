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
import EssayWorkspace from "../../../components/essay-workspace";
import { questionBank, questionsFor, questionsForCollection } from "../../../data/question-bank";
import type { Question } from "../../../data/question-bank";
import ActivityCatalog from "../../../components/activity-catalog";
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
  searchParams?: Promise<{ simulado?: string; lista?: string; area?: string }>;
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
  } else if (section === "suporte") content = <Support showPrivateEmail />;
  else if (section === "redacao") content = <EssayWorkspace />;
  else if (section === "correcoes") {
    const { data: attempts } = await who.db
      .from("assessment_attempts")
      .select("id,activity,collection_id,score,total,completed_at,answers")
      .eq("user_id", who.user.id)
      .order("completed_at", { ascending: false });
    content = attempts?.length ? (
      <div className="correction-history">
        <div className="section-intro-row">
          <div>
            <span className="eyebrow">Seu histórico</span>
            <h2>Correções e próximos passos</h2>
          </div>
          <Link className="button secondary" href="/aluno/exercicios">Nova tentativa</Link>
        </div>
        <div className="correction-history-list">
          {attempts.map((attempt) => {
            const percentage = attempt.total ? Math.round((attempt.score / attempt.total) * 100) : 0;
            const label = attempt.collection_id === "simulado-completo" ? "Provão completo ENEM" : attempt.collection_id || (attempt.activity === "simulado-1" ? "Simulado 1" : attempt.activity === "simulado-2" ? "Simulado 2" : "Exercícios");
            const questions = attempt.collection_id === "simulado-completo" ? questionBank.filter((question) => question.activity === "simulado-1" || question.activity === "simulado-2") : attempt.collection_id ? questionsForCollection(attempt.collection_id) : questionsFor(attempt.activity as Question["activity"]);
            const missed = questions.filter((question) => attempt.answers?.[question.id] !== question.answer);
            return (
              <details className="correction-history-card" key={attempt.id}>
                <summary>
                <div>
                  <span className="eyebrow">{label}</span>
                  <h3>{attempt.score} de {attempt.total} acertos</h3>
                  <p>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(attempt.completed_at))}</p>
                </div>
                <strong>{percentage}%</strong>
                </summary>
                <div className="correction-history-detail">
                  <p><b>{missed.length}</b> ponto(s) para retomar nesta tentativa.</p>
                  {missed.length ? missed.map((question) => <article className="correction wrong" key={question.id}><b>Questão {question.number} · {question.area}</b><p>{question.explanation}</p><small>Próximo passo: {question.nextStep}.</small></article>) : <p className="success">Você não deixou questões erradas nesta tentativa.</p>}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    ) : (
      <div className="empty-state correction-empty">
        <span className="eyebrow">Seu histórico</span>
        <h2>Suas correções aparecerão aqui</h2>
        <p>Finalize um exercício ou simulado para acompanhar acertos por área, pontos de atenção e recomendações personalizadas.</p>
        <Link className="button primary" href="/aluno/exercicios">Começar exercícios</Link>
      </div>
    );
  }
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
    const collectionId = search.lista && /^[a-z0-9-]+$/.test(search.lista) ? search.lista : undefined;
    const exerciseCollections = [...new Set(questionsFor("exercicios").map((question) => question.collectionId))];
    const exerciseArea = { linguagens: "Linguagens", humanas: "Ciências Humanas", natureza: "Ciências da Natureza", matematica: "Matemática" }[search.area || ""];
    const selectedQuestions = collectionId ? questionsForCollection(collectionId).filter((question) => !exerciseArea || question.area === exerciseArea) : [];
    const selectedCollectionId = selectedQuestions.length ? selectedQuestions[0].collectionId : undefined;
    const exerciseAreas = [
      ["linguagens", "Linguagens"],
      ["humanas", "Ciências Humanas"],
      ["natureza", "Ciências da Natureza"],
      ["matematica", "Matemática"],
    ] as const;
    content = selectedQuestions.length ? (
      <>
        <div className="assessment-switcher"><Link href="/aluno/exercicios">Todas as listas</Link><Link href="/aluno/correcoes">Ver correções</Link></div>
        <AssessmentPlayer questions={selectedQuestions} collectionId={selectedCollectionId} title={selectedCollectionId!.replace("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())} subtitle="Resolva no seu ritmo. Ao finalizar, a correção detalhada ficará salva no seu histórico." />
      </>
    ) : (
      <ActivityCatalog
        kind="exercicios"
        filters={[
          { label: "Todas", href: "/aluno/exercicios", active: !search.area },
          { label: "Linguagens", href: "/aluno/exercicios?area=linguagens", active: search.area === "linguagens" },
          { label: "Ciências Humanas", href: "/aluno/exercicios?area=humanas", active: search.area === "humanas" },
          { label: "Ciências da Natureza", href: "/aluno/exercicios?area=natureza", active: search.area === "natureza" },
          { label: "Matemática", href: "/aluno/exercicios?area=matematica", active: search.area === "matematica" },
        ]}
        items={search.area ? exerciseCollections.map((id) => {
          const collectionQuestions = questionsForCollection(id);
          const visibleQuestions = collectionQuestions.filter((question) => question.area === exerciseArea);
          if (!visibleQuestions.length) return null;
          return {
            id,
            title: id.replace("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
            count: visibleQuestions.length,
            areas: [...new Set(visibleQuestions.map((question) => question.area))],
            href: `/aluno/exercicios?lista=${id}&area=${search.area}`,
            eyebrow: "Lista de exercícios",
            supportingText: "Reforce conceitos e identifique seu próximo ponto de revisão.",
          };
        }).filter((item): item is NonNullable<typeof item> => Boolean(item)) : exerciseAreas.map(([slug, area]) => {
          const areaQuestions = questionsFor("exercicios").filter((question) => question.area === area);
          return {
            id: slug,
            title: area,
            count: areaQuestions.length,
            areas: [area],
            href: `/aluno/exercicios?area=${slug}`,
            eyebrow: "Área de exercícios",
            supportingText: "Abra os exercícios desta matéria e avance por listas temáticas.",
          };
        })}
      />
    );
  } else if (section === "simulados") {
    const selectedSimulation = search.simulado && /^simulado-(?:[1-9]|[12][0-9]|30)$/.test(search.simulado) ? search.simulado : undefined;
    const completeSimulationQuestions = questionBank.filter((question) => question.activity === "simulado-1" || question.activity === "simulado-2");
    const simulationCollections = [...new Set(completeSimulationQuestions.map((question) => question.collectionId))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const selectedQuestions = selectedSimulation ? questionsForCollection(selectedSimulation) : [];
    const selectedSimulationId = selectedQuestions.length ? selectedQuestions[0].collectionId : undefined;
    content = selectedQuestions.length ? (
      <>
        <div className="assessment-switcher"><Link href="/aluno/simulados">Todos os simulados</Link><Link href="/aluno/correcoes">Ver correções</Link></div>
        <AssessmentPlayer questions={selectedQuestions} collectionId={selectedSimulationId} title={selectedSimulationId!.replace("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())} subtitle="Resolva todas as questões. A correção detalhada aparece ao finalizar." />
      </>
    ) : (
      <ActivityCatalog
        kind="simulados"
        items={simulationCollections.map((id) => {
          const collectionQuestions = questionsForCollection(id);
          return {
            id,
            title: id.replace("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
            count: collectionQuestions.length,
            areas: [...new Set(collectionQuestions.map((question) => question.area))],
            href: `/aluno/simulados?simulado=${id}`,
            eyebrow: "Simulado ENEM",
            supportingText: "20 questões mescladas para medir seu desempenho geral.",
          };
        })}
      />
    );
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

