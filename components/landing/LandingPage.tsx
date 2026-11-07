import Link from "next/link";
import { Header, Footer, FAQ } from "../../components/site";
import { HeroProductPreview } from "./HeroProductPreview";
import { HeroStage } from "./HeroStage";
import { DemoStatusPanel } from "./DemoStatusPanel";
import { LandingMaterialCarousel } from "./LandingMaterialCarousel";
import PremiumOfferModal from "../../components/premium-offer-modal";
import { money, materials } from "../../lib/config";
import { publicPlans } from "../../lib/catalog";
import { checkoutConfigured } from "../../lib/readiness";
import { questionBank, toPublicQuestion } from "../../data/question-bank";

const steps = [["Escolha", "Selecione a disciplina e o tema que você quer estudar."], ["Pratique", "Resolva questões, simulados e listas focadas no ENEM."], ["Revise", "Veja explicações claras e retome os pontos que precisa reforçar."]];

const heroCovers = ["Língua Portuguesa", "Matemática", "Redação", "Física"]
  .map((title) => materials.find((item) => item.title === title))
  .filter((item): item is NonNullable<typeof item> => Boolean(item))
  .map((item) => ({ src: item.cover, title: item.title }));

export default async function LandingPage() {
  const plans = await publicPlans();
  const checkoutReady = checkoutConfigured();
  const demoQuestion = toPublicQuestion(questionBank[0]);
  return <div className="landing-shell landing-light">
    <Header />
    <main id="conteudo" className="reformulated-landing landing-light">
      <section className="landing-hero container petroleum-hero" aria-labelledby="landing-title">
        <div className="petroleum-hero-copy"><h1 id="landing-title">Sua próxima conquista <em>começa aqui.</em></h1><p>Estude com materiais completos, exercícios, simulados e um plano de estudos focado no ENEM.</p><div className="landing-actions"><Link className="ref-button ref-button-primary" href="#planos">Ver planos</Link><Link className="ref-button ref-button-link" href="#demo-questao">Experimentar uma questão</Link></div></div>
        <HeroStage covers={heroCovers} />
      </section>
      <section className="petroleum-benefits container" aria-label="Recursos para estudar"><article><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 3v2" /></svg><strong>Foco no ENEM</strong><p>Conteúdo direcionado à sua preparação.</p></article><article><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M12 3 3 8l9 5 9-5-9-5ZM3 12l9 5 9-5M3 16l9 5 9-5" /></svg><strong>Estudo completo</strong><p>Teoria, exercícios, simulados e e-books.</p></article><article><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M5 20V11M12 20V5M19 20v-6" /></svg><strong>Acompanhamento</strong><p>Veja sua evolução e ajuste sua rotina.</p></article></section>
      <section className="landing-demo container" aria-label="Demonstração da plataforma"><nav className="demo-sidebar" aria-label="Módulos demonstrados"><strong>GoDev</strong>{[["Resolver questões", "#demo-questao"], ["Simulados", "/entrar?redirect=/aluno/simulados"], ["Listas de exercícios", "/entrar?redirect=/aluno/exercicios"], ["E-books", "#materiais"], ["Meu progresso", "/entrar?redirect=/aluno"]].map(([item, href], index) => <Link className={index === 0 ? "is-active" : ""} href={index === 0 ? href : "#planos"} key={item}>{item}</Link>)}</nav><HeroProductPreview question={demoQuestion} demoAnswer={questionBank[0].answer} demoExplanation={questionBank[0].explanation} demoNextStep={questionBank[0].nextStep} /><DemoStatusPanel /></section>
      <section className="landing-steps container" id="como-funciona" aria-label="Como funciona">{steps.map(([title, body], index) => <article key={title}><span className="step-number">{index + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</section>
      <section className="landing-materials" id="materiais" aria-labelledby="materials-title"><div className="container materials-intro"><div><span className="landing-eyebrow">E-books</span><h2 id="materials-title">Materiais completos para aprofundar o seu estudo.</h2><p>Conteúdos organizados, objetivos e alinhados com o que mais cai no ENEM.</p><Link className="ref-button ref-button-link" href="#planos">Ver todos os e-books</Link></div><LandingMaterialCarousel /></div><div className="landing-stat-strip container"><span>16 e-books</span><i /> <span>30 simulados</span><i /> <span>60 listas</span><i /> <span>5 questões demonstrativas</span></div></section>
      <section className="landing-pricing" id="planos" aria-labelledby="plans-title"><div className="container"><span className="landing-eyebrow">Planos</span><h2 id="plans-title">Escolha o plano ideal para a sua jornada.</h2><div className="ref-pricing-grid">{plans.map((plan) => <article key={plan.id} className={`ref-price-card ${plan.id === "premium" ? "is-premium" : ""}`}>{plan.id === "premium" && <span className="ref-badge">Mais completo</span>}<h3>{plan.name}</h3><ul>{plan.features.map((feature) => <li key={feature}><span aria-hidden="true" />{feature}</li>)}</ul><div className="ref-price">{money(plan.cents)}<small>pagamento único</small></div>{checkoutReady ? <a className="ref-button ref-button-primary" href={`/api/checkout/${plan.id}`}>{`Quero o ${plan.name}`}</a> : <Link className="ref-button ref-button-primary" href="/suporte">Falar com atendimento</Link>}</article>)}</div><div className="ref-guarantee"><span className="ref-guarantee-mark" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="m5 12 4 4L19 6" /></svg></span><div className="ref-guarantee-copy"><strong>7 dias de garantia</strong><span>Compre com tranquilidade. Consulte as condições de reembolso e acesso.</span></div><Link href="/politicas/reembolso">Ler a política</Link></div></div></section>
      <section className="landing-faq container" id="duvidas" aria-labelledby="faq-title"><span className="landing-eyebrow">Dúvidas frequentes</span><h2 id="faq-title">Ficou com alguma dúvida?</h2><FAQ /></section>
    <section className="landing-final-cta container" aria-labelledby="final-cta-title"><h2 id="final-cta-title">Dê direção à sua preparação para o ENEM.</h2><p>Escolha o plano, acesse os materiais e organize sua rotina de estudos em um só lugar.</p><Link className="ref-button ref-button-primary" href="#planos">Ver planos</Link></section></main><Footer />
    {plans.find((plan) => plan.id === "premium") ? <PremiumOfferModal enabled trigger="manual" delayMs={0} cooldownDays={0} campaignId="premium-2026" checkoutHref={checkoutReady ? "/api/checkout/premium" : "/suporte"} plan={plans.find((plan) => plan.id === "premium")!} /> : null}
  </div>;
}



