import PlanView from "../../../../components/operacao/plan-view";
import { moduleById } from "../../../../lib/operacao/catalog";
import { editionCalendar, todayInSaoPaulo } from "../../../../lib/operacao/config";
import { buildPlan } from "../../../../lib/operacao/plan";

export const metadata = { title: "Minha revisão — Matemática e Natureza" };

export default function PlanPage() {
  const today = todayInSaoPaulo();
  const calendar = editionCalendar(today);
  const examDate = calendar?.state.calendarConfirmed && calendar.state.nextExam ? calendar.state.nextExam : null;
  const catalog = {
    moduleTitle: (id: string) => moduleById(id)?.title ?? null,
    moduleMinutes: (id: string) => moduleById(id)?.minutes ?? 20,
    moduleDiscipline: (id: string) => moduleById(id)?.discipline,
  };
  const plans = { "30": buildPlan(30, today, catalog, examDate), "60": buildPlan(60, today, catalog, examDate), "120": buildPlan(120, today, catalog, examDate) };
  return <PlanView plans={plans} today={today} calendarNote={calendar ? `${calendar.note.headline}. ${calendar.note.detail}` : ""} />;
}
