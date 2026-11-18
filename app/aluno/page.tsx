import Link from "next/link";
import MaterialsBrowser from "../../components/materials-browser";
import MomentumCard from "../../components/operacao/momentum-card";
import { Icon, type IconName } from "../../components/icons";
import { studentSummary } from "../../lib/aluno/summary";
import TodayCard from "../../components/aluno/today-card";
import { todayPlan } from "../../lib/aluno/today";
import { questions } from "../../lib/operacao/catalog";
import { campaignStatus, operacao } from "../../lib/operacao/config";
import { sessionKinds, type SessionKind } from "../../lib/operacao/kinds";

export const dynamic = "force-dynamic";
export const metadata = { title: "Início | GoDev Education" };

const greeting = () => {
  const hour = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone: "America/Sao_Paulo" }).format(new Date()));
  return hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
};

const quick: [string, string, string, IconName][] = [
  ["/aluno/treino-rapido", "Treino rápido", "5 questões por vez, com tempo por questão.", "zap"],
  [`${operacao.basePath}/treinos`, "Simulados e treinos", "Provas cronometradas com correção comentada.", "timer"],
  ["/aluno/flash-cards", "Flash cards", "Fichas de fórmulas com revisão espaçada.", "rotate-ccw"],
  ["/aluno/dashboard", "Dashboard", "Onde você acerta e onde precisa revisar.", "trending-up"],
];

export default async function Dashboard({ searchParams }: { searchParams?: Promise<{ aviso?: string }> }) {
  const notice = (await searchParams)?.aviso;
  const summary = await studentSummary();
  if (!summary) return null;
  const { who, isAdmin, plan, firstName, progress, momentum } = summary;
  const [{ data: materials }, { data: reading }, { data: tasks }] = await Promise.all([
    who.db.from("materials").select("*").eq("published", true),
    who.db.from("reading_progress").select("*").eq("user_id", who.user.id).order("updated_at", { ascending: false }),
    who.db.from("study_progress").select("*").eq("user_id", who.user.id).eq("done", false).order("date").limit(3),
  ]);
  const entitled = (plan: string, material: { plan: string }) => isAdmin || plan === "premium" || plan === material.plan;
  const visibleMaterials = ((materials || []) as { id: string; plan: string; title: string }[]).filter((material) => entitled(plan, material));
  const last = reading?.[0];
  const lastTitle = visibleMaterials.find((material) => material.id === last?.material_id)?.title || "Material em andamento";
  const g = progress?.gamification;
  const accuracy = g && g.practiced ? Math.round((g.firstTry / g.practiced) * 100) : null;
  const resume = progress?.activeSessions[0];
  const minutesPerQuestion = questions.length ? questions.reduce((sum, q) => sum + q.minutes, 0) / questions.length : 2;
  // Sem progresso carregado (plano ainda não ativo ou falha de leitura) não inventamos sugestões de estudo.
  const today = progress
    ? todayPlan({
        sessions: progress.activeSessions.map((s) => ({ ...s, title: (sessionKinds[s.kind as SessionKind]?.title || s.kind).split(" — ")[0] })),
        reading: last ? { materialId: last.material_id, title: lastTitle, page: last.page } : null,
        flashDue: progress.flashDue,
        toReview: progress.toReview,
        weak: progress.weak.map((w) => ({ discipline: w.discipline, topic: w.topic, lastPct: w.lastPct, answered: w.answered })),
        practiced: progress.gamification.practiced,
        nextModule: progress.nextModule ? { id: progress.nextModule.id, title: progress.nextModule.title, minutes: progress.nextModule.minutes } : null,
        minutesPerQuestion,
        basePath: operacao.basePath,
      })
    : null;
  const examPhase = campaignStatus().phase;
  const examNote = examPhase === "depois" ? "A edição do Enem que este material acompanhava já passou. Ainda não há data oficial cadastrada para a próxima: seu estudo, seus erros e seu histórico continuam disponíveis." : examPhase === "dia" ? "Hoje é dia de prova: confira documentos e local e descanse. Seu material continua salvo." : undefined;

  return (
    <div className="as-page">
      {notice === "redacao" ? <p className="portal-notice" role="status">A área de Redação está temporariamente indisponível. Seus textos e correções anteriores continuam guardados.</p> : null}
      <header className="as-head">
        <div>
          <h1>{greeting()}, {firstName}!</h1>
          <p>{momentum && momentum.streak > 0 ? `Você está há ${momentum.streak} ${momentum.streak === 1 ? "dia" : "dias"} em sequência. Continue hoje.` : "Comece um treino hoje para iniciar a sua sequência."}</p>
        </div>
      </header>

      {today ? <TodayCard primary={today.primary} others={today.others} examNote={examNote} /> : null}

      {plan === "none" ? (
        <section className="as-card" aria-labelledby="as-ativar">
          <h2 id="as-ativar">Seu acesso ainda não está ativo</h2>
          <p className="as-muted">Os materiais são liberados quando o pagamento é confirmado. Se você já pagou, fale com o atendimento com o e-mail da compra.</p>
          <div className="op-q-foot"><Link className="as-btn as-btn-primary" href="/aluno/planos">Ver planos</Link><Link className="as-btn" href="/aluno/suporte">Falar com o atendimento</Link></div>
        </section>
      ) : null}

      <nav className="as-quick" aria-label="Atalhos">
        {quick.map(([href, title, text, icon]) => (
          <Link key={href} href={href}><strong><Icon name={icon} size={18} aria-hidden="true" /> {title}</strong><span>{text}</span></Link>
        ))}
      </nav>

      {g ? (
        <div className="as-grid" aria-label="Seus números">
          <article className="as-card as-stat"><span>Questões praticadas</span><strong>{g.practiced}</strong><small>{g.questionsToday} hoje</small></article>
          <article className="as-card as-stat"><span>Acertos de primeira</span><strong>{accuracy === null ? "—" : `${accuracy}%`}</strong><small>{g.firstTry} de {g.practiced} questões</small></article>
          <article className="as-card as-stat"><span>Dias seguidos</span><strong>{momentum?.streak ?? 0}</strong><small>melhor: {momentum?.bestStreak ?? 0}</small></article>
          <article className="as-card as-stat"><span>Dias de estudo</span><strong>{momentum?.studyDays ?? 0}</strong><small>no total</small></article>
        </div>
      ) : null}

      <div className="as-grid-2">
        <div className="as-page">
          {momentum ? <MomentumCard data={momentum} /> : null}

          <section className="as-card" aria-labelledby="as-continue">
            <h2 id="as-continue">Continue de onde parou</h2>
            {resume ? (
              <p>Você tem uma atividade em andamento: {resume.answered} de {resume.total} questões respondidas. <Link className="op-link" href={`${operacao.basePath}/treinos`}>Retomar</Link></p>
            ) : last ? (
              <p>{lastTitle}: você parou na página {last.page}. <Link className="op-link" href={`/aluno/ler/${last.material_id}`}>Continuar leitura</Link></p>
            ) : progress?.nextModule ? (
              <p>Próxima revisão: <b>{progress.nextModule.title}</b> ({progress.nextModule.minutes} min). <Link className="op-link" href={`${operacao.basePath}/materiais/${progress.nextModule.id}`}>Começar</Link></p>
            ) : (
              <p className="as-muted">Escolha um material ou um treino para começar. <Link className="op-link" href="/aluno/materiais">Abrir materiais</Link></p>
            )}
            {progress && progress.toReview > 0 ? <p className="op-note">Você tem {progress.toReview} {progress.toReview === 1 ? "questão" : "questões"} para rever no <Link href={`${operacao.basePath}/erros`}>caderno de erros</Link>.</p> : null}
          </section>

          <section className="as-card" aria-labelledby="as-mesa">
            <h2 id="as-mesa">Sua mesa de estudos <span className="as-tag">{visibleMaterials.length} itens</span></h2>
            <MaterialsBrowser items={visibleMaterials as never} defaultView="list" />
          </section>
        </div>

        <aside className="as-page" aria-label="Resumo">
          <section className="as-card">
            <h2>Próximos passos</h2>
            {tasks?.length ? (
              <ul className="as-list">
                {(tasks as { id: string; title: string; date: string }[]).map((task) => <li key={task.id}><span>{task.title}</span><small className="as-muted">{task.date.split("-").reverse().join("/")}</small></li>)}
              </ul>
            ) : <p className="as-muted">Nenhuma atividade pendente. Monte o seu <Link className="op-link" href="/aluno/cronograma">cronograma</Link> ou siga o plano de <Link className="op-link" href={`${operacao.basePath}/plano`}>Minha revisão</Link>.</p>}
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
