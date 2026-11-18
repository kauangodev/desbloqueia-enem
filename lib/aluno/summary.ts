import "server-only";
import { cache } from "react";
import { identity } from "../supabase";
import { loadProgress } from "../operacao/progress";
import { operacaoUser } from "../operacao/store";

export type PlanKey = "admin" | "premium" | "essencial" | "none";
export const planLabel: Record<PlanKey, string> = { admin: "Administrador", premium: "Premium", essencial: "Essencial", none: "Aguardando acesso" };

/**
 * Resumo do aluno para o menu, a barra superior e as páginas novas. Uma leitura por requisição (cache do React).
 * Qualquer falha de leitura do progresso vira `progress: null`: a área nunca quebra por causa do ritmo de estudo.
 */
export const studentSummary = cache(async () => {
  const who = await identity();
  if (!who) return null;
  const isAdmin = who.profile?.role === "admin";
  let plan: PlanKey = isAdmin ? "admin" : "none";
  if (!isAdmin) {
    try {
      const { data } = await who.db.from("entitlements").select("plan").eq("active", true).eq("user_id", who.user.id);
      const plans = ((data || []) as { plan: string }[]).map((row) => row.plan);
      plan = plans.includes("premium") ? "premium" : plans.length ? "essencial" : "none";
    } catch { plan = "none"; }
  }
  let progress: Awaited<ReturnType<typeof loadProgress>> | null = null;
  try {
    const user = await operacaoUser();
    if (user) progress = await loadProgress(user);
  } catch { progress = null; }
  const name = who.profile?.name || "";
  return { who, isAdmin, plan, planLabel: planLabel[plan], firstName: name.split(" ")[0] || "estudante", progress, momentum: progress?.momentum ?? null };
});
