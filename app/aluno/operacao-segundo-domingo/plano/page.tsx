import PlanView from "../../../../components/operacao/plan-view";
import { moduleById } from "../../../../lib/operacao/catalog";
import { todayInSaoPaulo } from "../../../../lib/operacao/config";
import { buildPlan } from "../../../../lib/operacao/plan";

export const metadata = { title: "Minha revisão — Operação 2º Domingo" };

export default function PlanPage() {
  const today = todayInSaoPaulo();
  const catalog = {
    moduleTitle: (id: string) => moduleById(id)?.title ?? null,
    moduleMinutes: (id: string) => moduleById(id)?.minutes ?? 20,
    moduleDiscipline: (id: string) => moduleById(id)?.discipline,
  };
  const plans = { "30": buildPlan(30, today, catalog), "60": buildPlan(60, today, catalog), "120": buildPlan(120, today, catalog) };
  return <PlanView plans={plans} today={today} />;
}
