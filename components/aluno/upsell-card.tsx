import Link from "next/link";
import type { PlanKey } from "../../lib/aluno/summary";

/** Card do menu lateral: convida quem ainda não tem o Premium. Admin e Premium não veem. */
export default function UpsellCard({ plan }: { plan: PlanKey }) {
  if (plan === "premium" || plan === "admin") return null;
  const none = plan === "none";
  return (
    <aside className="as-upsell" aria-label={none ? "Ative seu acesso" : "Plano Premium"}>
      <strong>{none ? "Ative seu acesso" : "Desbloqueie o Premium"}</strong>
      <p>{none ? "Escolha um plano para liberar o material." : "16 e-books, banco geral, biblioteca histórica e fichas da reta final."}</p>
      <Link href="/aluno/planos">Ver planos</Link>
    </aside>
  );
}
