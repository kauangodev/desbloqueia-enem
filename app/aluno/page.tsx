import { identity } from "../../lib/supabase";
import Resources from "../../components/resources";
import Link from "next/link";
import GamificationPanel from "../../components/gamification-panel";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const who = await identity();
  if (!who) return null;
  const [
    { data: materials },
    { data: progress },
    { data: access },
    { data: tasks },
    { count: activityCount },
    { count: essayCount },
  ] = await Promise.all([
    who.db.from("materials").select("*").eq("published", true),
    who.db
      .from("reading_progress")
      .select("*")
      .eq("user_id", who.user.id)
      .order("updated_at", { ascending: false }),
    who.db
      .from("entitlements")
      .select("plan")
      .eq("active", true)
      .eq("user_id", who.user.id),
    who.db
      .from("study_progress")
      .select("*")
      .eq("user_id", who.user.id)
      .eq("done", false)
      .order("date")
      .limit(3),
    who.db
      .from("assessment_attempts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", who.user.id),
    who.db
      .from("essay_submissions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", who.user.id),
  ]);

  const isAdmin = who.profile?.role === "admin";
  const visibleMaterials = (materials || []).filter(
    (material) =>
      isAdmin ||
      access?.some(
        (entitlement) =>
          entitlement.plan === "premium" || entitlement.plan === material.plan,
      ),
  );
  const plan = isAdmin
    ? "Administrador"
    : access?.some((e) => e.plan === "premium")
      ? "Premium"
      : access?.length
        ? "Essencial"
        : "Aguardando acesso";
  const firstName = who.profile?.name?.split(" ")[0] || "estudante";
  const firstLetter = firstName.slice(0, 1).toUpperCase();

  return (
    <div className="student-dashboard">
      <section className="student-welcome" aria-labelledby="student-welcome-title">
        <div className="student-welcome-copy">
          <span className="student-eyebrow">Seu espaço de estudo</span>
          <h1 id="student-welcome-title">Seu próximo passo começa aqui.</h1>
          <p>Olá, {firstName}. Organize sua revisão, acompanhe seu progresso e continue seus estudos de onde parou.</p>
          <div className="student-welcome-actions">
            <Link className="student-primary-action" href={progress?.[0] ? `/aluno/ler/${progress[0].material_id}` : "/aluno/materiais"}>
              {progress?.[0] ? "Continuar estudando" : "Explorar materiais"}
            </Link>
            <Link className="student-secondary-action" href="/aluno/cronograma">Ver cronograma</Link>
          </div>
        </div>
        <div className="student-welcome-art" aria-hidden="true">
          <span>DESBLOQUEIA</span>
          <strong>ENEM<br />2026</strong>
          <i />
          <small>Estude com direção.</small>
        </div>
      </section>

      <div className="student-stat-grid" aria-label="Resumo do seu espaço">
        <article className="student-stat-card accent">
          <span>Meu plano</span>
          <strong>{plan}</strong>
          <small>{access?.length ? "Acesso ativo" : "Acesso ainda não liberado"}</small>
        </article>
        <article className="student-stat-card">
          <span>Materiais disponíveis</span>
          <strong>{visibleMaterials.length}</strong>
          <small>Conteúdos liberados para você</small>
        </article>
        <article className="student-stat-card">
          <span>Atividades concluídas</span>
          <strong>{activityCount || 0}</strong>
          <small>Exercícios e simulados registrados</small>
        </article>
        <article className="student-stat-card">
          <span>Redações enviadas</span>
          <strong>{essayCount || 0}</strong>
          <small>Histórico de produção</small>
        </article>
      </div>

      <div className="student-dashboard-grid">
        <div className="student-main-column">
          <section className="student-section-block" aria-labelledby="continue-title">
            <div className="student-section-heading">
              <div>
                <span className="student-eyebrow">Retome sua jornada</span>
                <h2 id="continue-title">Continue de onde parou</h2>
              </div>
              <Link href="/aluno/materiais">Ver todos</Link>
            </div>
            {progress?.[0] ? (
              <article className="student-continue-card">
                <div className="student-continue-cover">
                  <span>LEITURA</span>
                  <strong>{visibleMaterials.find((m) => m.id === progress[0].material_id)?.title || "Material em andamento"}</strong>
                </div>
                <div className="student-continue-copy">
                  <span className="student-status-pill">Em andamento</span>
                  <h3>{visibleMaterials.find((m) => m.id === progress[0].material_id)?.title || "Material em andamento"}</h3>
                  <p>Você parou na página {progress[0].page}. Continue no leitor protegido da plataforma.</p>
                  <Link className="student-inline-action" href={`/aluno/ler/${progress[0].material_id}`}>Continuar leitura <span aria-hidden="true">→</span></Link>
                </div>
              </article>
            ) : (
              <div className="student-empty-card">
                <strong>Seu próximo material pode começar hoje.</strong>
                <p>Escolha um conteúdo e registre sua primeira leitura para acompanhar seu ritmo.</p>
                <Link className="student-inline-action" href="/aluno/materiais">Abrir materiais <span aria-hidden="true">→</span></Link>
              </div>
            )}
          </section>

          <section className="student-section-block" aria-labelledby="materials-title">
            <div className="student-section-heading">
              <div>
                <span className="student-eyebrow">Conteúdo liberado</span>
                <h2 id="materials-title">Sua mesa de estudos</h2>
              </div>
              <span className="student-count">{visibleMaterials.length} itens</span>
            </div>
            <Resources items={visibleMaterials} />
          </section>
        </div>

        <aside className="student-context-panel" aria-label="Resumo da sua jornada">
          <div className="student-profile-card">
            <span className="student-avatar" aria-hidden="true">{firstLetter}</span>
            <div><strong>{firstName}</strong><small>{plan}</small></div>
            <Link href="/aluno/conta" aria-label="Abrir minha conta">···</Link>
          </div>
          <div className="student-context-section">
            <div className="student-context-heading"><span>Próximos passos</span><Link href="/aluno/cronograma">Abrir</Link></div>
            {tasks?.length ? (
              <ul className="student-next-list">
                {tasks.map((task) => (
                  <li key={task.id}><span className="student-task-dot" /> <div><strong>{task.title}</strong><small>{task.date.split("-").reverse().join("/")}</small></div></li>
                ))}
              </ul>
            ) : (
              <p className="student-context-empty">Nenhuma atividade pendente. Organize seu próximo bloco de estudo.</p>
            )}
          </div>
          <div className="student-context-section student-context-note">
            <span className="student-eyebrow">Acesso protegido</span>
            <strong>Estude no seu ritmo.</strong>
            <p>Seu progresso e seus materiais ficam vinculados à sua conta.</p>
          </div>
        </aside>
      </div>
      <GamificationPanel />
    </div>
  );
}

