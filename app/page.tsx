import { Brand } from "../components/site";
import StudyRoutineQuiz from "../components/landing/StudyRoutineQuiz";
import { campaign, campaignView } from "../lib/campaign";
import { canAccess } from "../lib/supabase";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seu ponto de partida | GoDev Education", alternates: { canonical: "/" } };

export default async function Home() {
  const view = campaignView();
  const hasAccess = view.active ? Boolean(await canAccess("essencial").catch(() => null)) : false;
  const quizCampaign = { active: view.active, tag: view.label.replace("Reta final ENEM", "Reta final para Matemática e Natureza"), countdown: view.countdown, hasAccess, offerHref: campaign.destinations.offer, studyHref: campaign.destinations.studyArea, previewHref: "/landing" + campaign.destinations.preview };
  return <main className="diagnostico-page"><header className="diagnostico-header"><Brand /><div className="diagnostico-meta" aria-label="Progresso do diagnóstico"><span>QUIZ ENEM 2026</span><i aria-hidden="true" /><span>8 perguntas</span></div></header><StudyRoutineQuiz campaign={quizCampaign} /></main>;
}

