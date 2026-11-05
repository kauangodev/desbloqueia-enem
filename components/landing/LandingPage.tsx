import Link from "next/link";
import { Header, Footer, FAQ } from "../../components/site";
import { HeroProductPreview } from "./HeroProductPreview";
import { DemoStatusPanel } from "./DemoStatusPanel";
import { LandingMaterialCarousel } from "./LandingMaterialCarousel";
import PremiumOfferModal from "../../components/premium-offer-modal";
import { money } from "../../lib/config";
import { publicPlans } from "../../lib/catalog";
import { checkoutConfigured } from "../../lib/readiness";
import { questionBank, toPublicQuestion } from "../../data/question-bank";

const steps = [["Escolha", "Selecione a disciplina e o tema que você quer estudar."], ["Pratique", "Resolva questões, simulados e listas focadas no ENEM."], ["Revise", "Veja explicações claras e retome os pontos que precisa reforçar."]];

export default async function LandingPage() {
  const plans = await publicPlans();
  const checkoutReady = checkoutConfigured();
  const demoQuestion = toPublicQuestion(questionBank[0]);
  return <div className="landing-shell landing-dark">
    <Header />
    <main id="conteudo" className="reformulated-landing landing-dark">
      <section className="landing-hero container" aria-labelledby="landing-title"><span className="landing-eyebrow">Preparação para o ENEM 2026</span><h1 id="landing-title">Uma preparação clara começa com o próximo passo.</h1><p>Questões, simulados e e-books organizados para você estudar de forma objetiva, no seu ritmo, com foco no que realmente importa.</p><div className="landing-actions"><Link className="ref-button ref-button-primary" href="#demo-questao">Resolver uma questão grátis</Link><Link className="ref-button ref-button-link" href="#planos">Conhecer planos</Link></div></section>
      <section className="landing-demo container" aria-label="Demonstração da plataforma"><nav className="demo-sidebar" aria-label="Módulos demonstrados"><strong>GoDev</strong>{[["Resolver questões", "#demo-questao"], ["Simulados", "/entrar?redirect=/aluno/simulados"], ["Listas de exercícios", "/entrar?redirect=/aluno/exercicios"], ["E-books", "#materiais"], ["Meu progresso", "/entrar?redirect=/aluno"]].map(([item, href], index) => <Link className={index === 0 ? "is-active" : ""} href={index === 0 ? href : "#planos"} key={item}>{item}</Link>)}</nav><HeroProductPreview question={demoQuestion} demoAnswer={questionBank[0].answer} demoExplanation={questionBank[0].explanation} demoNextStep={questionBank[0].nextStep} /><DemoStatusPanel /></section>
      <section className="landing-steps container" aria-label="Como funciona">{steps.map(([title, body], index) => <article key={title}><span className="step-number">{index + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</section>
      <section className="landing-materials" id="materiais" aria-labelledby="materials-title"><div className="container materials-intro"><div><span className="landing-eyebrow">E-books</span><h2 id="materials-title">Materiais completos para aprofundar o seu estudo.</h2><p>Conteúdos organizados, objetivos e alinhados com o que mais cai no ENEM.</p><Link className="ref-button ref-button-link" href="#planos">Ver todos os e-books</Link></div><LandingMaterialCarousel /></div><div className="landing-stat-strip container"><span>16 e-books</span><i /> <span>30 simulados</span><i /> <span>60 listas</span><i /> <span>5 questões demonstrativas</span></div></section>
      <section className="landing-pricing" id="planos" aria-labelledby="plans-title"><div className="container"><span className="landing-eyebrow">Planos</span><h2 id="plans-title">Escolha o plano ideal para a sua jornada.</h2><div className="ref-pricing-grid">{plans.map((plan) => <article key={plan.id} className={`ref-price-card ${plan.id === "premium" ? "is-premium" : ""}`}>{plan.id === "premium" && <span className="ref-badge">Mais completo</span>}<h3>{plan.name}</h3><ul>{plan.features.map((feature) => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}</ul><div className="ref-price">{money(plan.cents)}<small>pagamento único</small></div><Link className="ref-button ref-button-primary" href={checkoutReady ? `/api/checkout/${plan.id}` : "/suporte"}>{checkoutReady ? `Quero o ${plan.name}` : "Falar com atendimento"}</Link></article>)}</div><div className="ref-guarantee"><span className="ref-guarantee-mark" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="m5 12 4 4L19 6" /></svg></span><div className="ref-guarantee-copy"><strong>7 dias de garantia</strong><span>Compre com tranquilidade. Consulte as condições de reembolso e acesso.</span></div><Link href="/politicas/reembolso">Ler a política</Link></div></div></section>
      <section className="landing-faq container" id="duvidas" aria-labelledby="faq-title"><span className="landing-eyebrow">Dúvidas frequentes</span><h2 id="faq-title">Ficou com alguma dúvida?</h2><FAQ /></section>
    </main><Footer />
    {plans.find((plan) => plan.id === "premium") ? <PremiumOfferModal enabled trigger="demo-report" delayMs={5000} cooldownDays={0} campaignId="premium-2026" checkoutHref={checkoutReady ? "/api/checkout/premium" : "/suporte"} plan={plans.find((plan) => plan.id === "premium")!} /> : null}
  </div>;
}



