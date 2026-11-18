import Link from "next/link";
import TodayCard from "../../components/aluno/today-card";
import { Icon, type IconName } from "../../components/icons";
import { studentSummary } from "../../lib/aluno/summary";
import { todayPlan } from "../../lib/aluno/today";
import { trilhaForToday } from "../../lib/trilha/service";
import { questions } from "../../lib/operacao/catalog";
import { campaignStatus, operacao, todayInSaoPaulo } from "../../lib/operacao/config";
import { sessionKinds, type SessionKind } from "../../lib/operacao/kinds";
import { operacaoUser } from "../../lib/operacao/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Início | GoDev Education" };

const greeting = () => {
  const hour = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone: "America/Sao_Paulo" }).format(new Date()));
  return hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
};

const shortcuts: [string, string, string, IconName][] = [
  ["/aluno/trilha", "Trilha ENEM", "Unidades com fundamento, prática e desafio.", "target"],
  ["/aluno/treino-rapido", "Treino rápido", "5 questões por vez.", "zap"],
  [`${operacao.basePath}/questoes`, "Banco de questões", "Filtre por assunto, ano e dificuldade.", "clipboard-check"],
  ["/aluno/flash-cards", "Flash cards", "Fichas com revisão espaçada.", "rotate-ccw"],
];

export default async function Dashboard({ searchParams }: { searchParams?: Promise<{ aviso?: string }> }) {
  const notice = (await searchParams)?.aviso;
  const summary = await studentSummary();
  if (!summary) return null;
  const { who, isAdmin, plan, firstName, progress, momentum } = summary;
  const [{ data: materials }, { data: reading }, { data: tasks }] = await Promise.all([
    who.db.from("materials").select("id,plan,title").eq("published", true),
    who.db.from("reading_progress").select("*").eq("user_id", who.user.id).order("updated_at", { ascending: false }),
    who.db.from("study_progress").select("*").eq("user_id", who.user.id).eq("done", false).order("date").limit(3),
  ]);
  const visibleMaterials = ((materials || []) as { id: string; plan: string; title: string }[]).filter((m) => isAdmin || plan === "premium" || plan === m.plan);
  const last = reading?.[0];
  const lastTitle = visibleMaterials.find((m) => m.id === last?.material_id)?.title || "Material em andamento";
  const g = progress?.gamification;
  const today = todayInSaoPaulo();
  const minutesPerQuestion = questions.length ? questions.reduce((sum, q) => sum + q.minutes, 0) / questions.length : 2;

  // Trilha: leitura do estado pode falhar sem derrubar o Início.
  let trilha: Awaited<ReturnType<typeof trilhaForToday>> = null;
  try { const user = await operacaoUser(); if (user) trilha = await trilhaForToday(user, today); } catch { trilha = null; }

  // Sem progresso carregado (plano ainda não ativo ou falha de leitura) não inventamos sugestões de estudo.
  const plan2 = progress
    ? todayPlan({
        sessions: progress.activeSessions.map((s) => ({ ...s, title: (sessionKinds[s.kind as SessionKind]?.title || s.kind).split(" — ")[0] })),
        trilha,
        reading: last ? { materialId: last.material_id, title: lastTitle, page: last.page } : null,
        flashDue: progress.flashDue,
        toReview: progress.toReview,
        weak: progress.weak.map((w) => ({ discipline: w.discipline, topic: w.topic, lastPct: w.lastPct, answered: w.answered })),
        practiced: g?.practiced ?? 0,
        nextModule: progress.nextModule ? { id: progress.nextModule.id, title: progress.nextModule.title, minutes: progress.nextModule.minutes } : null,
        minutesPerQuestion,
        basePath: operacao.basePath,
        today,
      })
    : null;
  const examPhase = campaignStatus().phase;
  const examNote = examPhase === "depois" ? "A edição do Enem que este material acompanhava já passou. Ainda não há data oficial cadastrada para a próxima: seu estudo, seus erros e seu histórico continuam disponíveis." : examPhase === "dia" ? "Hoje é dia de prova: confira documentos e local e descanse. Seu material continua salvo." : undefined;
  const accuracy = g && g.practiced ? Math.round((g.firstTry / g.practiced) * 100) : null;

  return (
    <div className="as-page">
      {notice === "redacao" ? <p className="portal-notice" role="status">A área de Redação está temporariamente indisponível. Seus textos e correções anteriores continuam guardados.</p> : null}
      <header className="as-head">
        <div>
          <h1>{greeting()}, {firstName}</h1>
          <p>{momentum && momentum.streak > 0 ? `${momentum.streak} ${momentum.streak === 1 ? "dia" : "dias"} em sequência. Continue hoje.` : "Um passo por vez: comece pelo que está logo abaixo."}</p>
        </div>
      </header>

      {plan2 ? <TodayCard primary={plan2.primary} others={plan2.others} examNote={examNote} /> : null}

      {plan === "none" ? (
        <section className="as-card" aria-labelledby="as-ativar">
          <h2 id="as-ativar">Seu acesso ainda não está ativo</h2>
          <p className="as-muted">Os materiais são liberados quando o pagamento é confirmado. Se você já pagou, fale com o atendimento com o e-mail da compra.</p>
          <div className="op-q-foot"><Link className="as-btn as-btn-primary" href="/aluno/planos">Ver planos</Link><Link className="as-btn" href="/aluno/suporte">Falar com o atendimento</Link></div>
        </section>
      ) : null}

      <nav aria-label="Atalhos">
        <ul className="as-shortcuts">
          {shortcuts.map(([href, title, text, icon]) => (
            <li key={href}><Link href={href}><Icon name={icon} size={20} aria-hidden="true" /><span><strong>{title}</strong><small>{text}</small></span></Link></li>
          ))}
        </ul>
      </nav>

      <div className="as-grid-2">
        {g && momentum ? (
          <section className="as-card as-summary" aria-labelledby="as-resumo">
            <h2 id="as-resumo">Seu progresso</h2>
            <div className="as-summary-row">
              <div><span>Questões praticadas</span><strong>{g.practiced}</strong></div>
              <div><span>Acertos de primeira</span><strong>{accuracy === null ? "—" : `${accuracy}%`}</strong></div>
              <div><span>Sequência</span><strong>{momentum.streak} {momentum.streak === 1 ? "dia" : "dias"}</strong></div>
              <div><span>Nível</span><strong>{momentum.level}</strong></div>
            </div>
            <div className="as-summary-foot">
              <span className="as-week" role="img" aria-label="Estudo nos últimos 7 dias">{momentum.week.map((d) => <i key={d.date} className={`${d.studied ? "is-done" : ""}${d.today ? " is-today" : ""}`} />)}</span>
              <span>Missões de hoje: {momentum.missionsDone}/{momentum.missions.length} · <Link className="op-link" href="/aluno/missoes">Missões</Link> · <Link className="op-link" href="/aluno/ofensiva">Ofensiva</Link></span>
              <Link className="op-link" href="/aluno/dashboard">Ver o Dashboard</Link>
            </div>
          </section>
        ) : null}
        <aside className="as-page" aria-label="Mais">
          <section className="as-card">
            <h2>Próximas tarefas</h2>
            {tasks?.length ? (
              <ul className="as-list">
                {(tasks as { id: string; title: string; date: string }[]).map((task) => <li key={task.id}><span>{task.title}</span><small className="as-muted">{task.date.split("-").reverse().join("/")}</small></li>)}
              </ul>
            ) : <p className="as-muted">Nada pendente. Monte o seu <Link className="op-link" href="/aluno/cronograma">cronograma</Link> ou siga a <Link className="op-link" href={`${operacao.basePath}/plano`}>Minha revisão</Link>.</p>}
            <p className="as-muted" style={{ marginBottom: 0 }}><Link className="op-link" href="/aluno/materiais">Abrir meus materiais ({visibleMaterials.length})</Link></p>
          </section>
          {plan === "essencial" ? (
            <section className="as-card">
              <h2>Vá além com o Premium</h2>
              <p className="as-muted">16 e-books, banco geral, biblioteca histórica e fichas da reta final, com o mesmo pagamento único.</p>
              <Link className="as-btn as-btn-primary" href="/aluno/planos">Conhecer o Premium</Link>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
