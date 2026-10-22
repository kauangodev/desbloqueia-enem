import { identity } from "../../lib/supabase";
import Resources from "../../components/resources";
import Link from "next/link";
export default async function Dashboard() {
  const who = await identity();
  if (!who) return null;
  const [
    { data: materials },
    { data: progress },
    { data: access },
    { data: tasks },
  ] = await Promise.all([
    who.db.from("materials").select("*").eq("published", true),
    who.db
      .from("reading_progress")
      .select("*")
      .order("updated_at", { ascending: false }),
    who.db
      .from("entitlements")
      .select("plan")
      .eq("active", true)
      .eq("user_id", who.user.id),
    who.db
      .from("study_progress")
      .select("*")
      .eq("done", false)
      .order("date")
      .limit(3),
  ]);
  const plan = access?.some((e) => e.plan === "premium")
    ? "Premium"
    : access?.length
      ? "Essencial"
      : "Aguardando acesso";
  return (
    <>
      <h1 className="page-title">
        Olá, {who.profile?.name?.split(" ")[0] || "estudante"}.
      </h1>
      <p>Um passo de cada vez. Vamos continuar sua revisão?</p>
      <div className="stat-grid">
        <div className="stat">
          <strong>{plan}</strong>
          <span>Seu plano</span>
        </div>
        <div className="stat">
          <strong>{materials?.length || 0}</strong>
          <span>Materiais disponíveis</span>
        </div>
        <div className="stat">
          <strong>{progress?.length || 0}</strong>
          <span>Leituras iniciadas</span>
        </div>
      </div>
      {progress?.[0] && (
        <p className="status-message">
          Sua última leitura ficou na página {progress[0].page}.{" "}
          <Link href={`/aluno/ler/${progress[0].material_id}`}>
            Continuar leitura
          </Link>
        </p>
      )}
      <h2>Na sua mesa de estudos</h2>
      <Resources items={materials || []} />
      <h2>Seus próximos passos</h2>
      {tasks?.length ? (
        <ul className="task-list">
          {tasks.map((t) => (
            <li key={t.id}>
              <span>{t.title}</span>
              <small>{t.date.split("-").reverse().join("/")}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          Que tal reservar um horário para revisar?{" "}
          <Link className="text-link" href="/aluno/cronograma">
            Organizar cronograma
          </Link>
        </p>
      )}
    </>
  );
}
