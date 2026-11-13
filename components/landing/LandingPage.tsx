import Link from "next/link";
import { Header, Footer, FAQ } from "../../components/site";
import HeroExplorer from "./HeroExplorer";
import CheckoutParams from "./CheckoutParams";
import StickyBuy from "./StickyBuy";
import { LandingMaterialCarousel } from "./LandingMaterialCarousel";
import PremiumOfferModal from "../../components/premium-offer-modal";
import { money } from "../../lib/config";
import { publicPlans } from "../../lib/catalog";
import { checkoutConfigured } from "../../lib/readiness";
import { buildExplorerData } from "../../lib/explorer-data";
import { inventory } from "../../lib/inventory";
import { campaign, campaignView } from "../../lib/campaign";
import { campaignFacts } from "../../lib/operacao/campaign-facts";
import { canAccess } from "../../lib/supabase";
import { CampaignHeroFacts, CampaignHeroLead, CampaignJourney, CampaignOfferNote } from "./CampaignSections";

const steps = [["Escolha", "Selecione a disciplina e o tema que você quer estudar."], ["Pratique", "Resolva questões, simulados e listas focadas no ENEM."], ["Revise", "Veja explicações claras e retome os pontos que precisa reforçar."]];

export default async function LandingPage() {
  const plans = await publicPlans();
  const checkoutReady = checkoutConfigured();
  const view = campaignView();
  const facts = campaignFacts();
  // Quem já tem acesso ao conteúdo vê "Continuar minha revisão"; falha na consulta nunca quebra a landing.
  const hasAccess = view.active ? Boolean(await canAccess("essencial").catch(() => null)) : false;
  const inv = inventory();
  const explorer = buildExplorerData({ counts: { questions: facts.questions, modules: facts.modules, simulados: facts.simulados, simuladoQuestions: facts.simuladoQuestions, treinos: facts.treinos }, studyArea: campaign.destinations.studyArea, hasAccess, countdown: view.countdown, active: view.active });
  return <div className="landing-shell landing-light">
    <CheckoutParams />
    {view.active && checkoutReady && !hasAccess ? <StickyBuy href="/api/checkout/premium" label={view.primaryCta} alert={view.countdown ?? undefined} /> : null}
    <Header />
    <main id="conteudo" className="reformulated-landing landing-light">
      <section className="landing-hero container petroleum-hero" aria-labelledby="landing-title">
        <div className="petroleum-hero-copy"><CampaignHeroLead view={view} /><h1 id="landing-title">{view.headline} <em>{view.emphasis}</em></h1><p>{view.support}</p><div className="landing-actions">{view.active && hasAccess ? <Link className="ref-button ref-button-primary" href={campaign.destinations.studyArea} data-analytics-event="campaign_hero_cta">Continuar minha revisão</Link> : view.active && checkoutReady ? <a className="ref-button ref-button-primary ref-button-hot" href="/api/checkout/premium" data-analytics-event="campaign_hero_cta">{view.primaryCta}</a> : <Link className="ref-button ref-button-primary" href="#planos" data-analytics-event={view.active ? "campaign_hero_cta" : undefined}>{view.primaryCta}</Link>}<Link className="ref-button ref-button-link" href="#planos">Ver planos e o que está incluído</Link></div><CampaignHeroFacts view={view} facts={facts} /></div>
        <HeroExplorer data={explorer} />
      </section>
      <section className="petroleum-benefits container" aria-label="Recursos para estudar"><article><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 3v2" /></svg><strong>Foco no ENEM</strong><p>Conteúdo direcionado à sua preparação.</p></article><article><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M12 3 3 8l9 5 9-5-9-5ZM3 12l9 5 9-5M3 16l9 5 9-5" /></svg><strong>Estudo completo</strong><p>Teoria, exercícios, simulados e e-books.</p></article><article><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M5 20V11M12 20V5M19 20v-6" /></svg><strong>Acompanhamento</strong><p>Veja sua evolução e ajuste sua rotina.</p></article></section>
      <CampaignJourney view={view} facts={facts} hasAccess={hasAccess} />
      <section className="landing-pricing" id="planos" aria-labelledby="plans-title"><div className="container"><span className="landing-eyebrow">Planos</span><h2 id="plans-title">Escolha o plano ideal para a sua jornada.</h2><CampaignOfferNote view={view} facts={facts} /><div className="ref-pricing-grid">{[...plans].sort((a, b) => (a.id === "premium" ? -1 : b.id === "premium" ? 1 : 0)).map((plan) => <article key={plan.id} className={`ref-price-card ${plan.id === "premium" ? "is-premium" : ""}`}>{plan.id === "premium" && <span className="ref-badge">Recomendado · mais completo</span>}<h3>{plan.name}</h3><ul>{plan.features.map((feature) => <li key={feature}><span aria-hidden="true" />{feature}</li>)}</ul><div className="ref-price">{money(plan.cents)}<small>pagamento único</small></div>{checkoutReady ? <a className={`ref-button ref-button-primary${plan.id === "premium" ? " ref-button-hot" : ""}`} href={`/api/checkout/${plan.id}`}>{`Quero o ${plan.name}`}</a> : <Link className="ref-button ref-button-primary" href="/suporte">Falar com atendimento</Link>}</article>)}</div><p className="ref-fee-note">Pagamento único, com Pix ou cartão, no checkout seguro da Cakto. O checkout soma uma taxa de serviço de R$ 0,99 ao valor do plano.</p><div className="ref-guarantee"><span className="ref-guarantee-mark" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="m5 12 4 4L19 6" /></svg></span><div className="ref-guarantee-copy"><strong>7 dias de garantia</strong><span>Compre com tranquilidade. Consulte as condições de reembolso e acesso.</span></div><Link href="/politicas/reembolso">Ler a política</Link></div></div></section>
      <section className="landing-steps container" id="como-funciona" aria-label="Como funciona">{steps.map(([title, body], index) => <article key={title}><span className="step-number">{index + 1}</span><h3>{title}</h3><p>{body}</p></article>)}</section>
      <section className="landing-materials" id="materiais" aria-labelledby="materials-title"><div className="container materials-intro"><div><span className="landing-eyebrow">E-books</span><h2 id="materials-title">Materiais completos para aprofundar o seu estudo.</h2><p>Conteúdos organizados, objetivos e alinhados com o que mais cai no ENEM.</p><Link className="ref-button ref-button-link" href="#planos">Ver todos os e-books</Link></div><LandingMaterialCarousel /></div><div className="landing-stat-strip container"><span>16 e-books</span><i /> <span>{facts.questions} questões comentadas de Matemática e Natureza</span><i /> <span>{facts.simulados} simulados de {facts.simuladoQuestions} questões</span><i /> <span>{inv.simulados} simulados e {inv.lists} listas do banco geral</span></div></section>
      <section className="landing-faq container" id="duvidas" aria-labelledby="faq-title"><span className="landing-eyebrow">Dúvidas frequentes</span><h2 id="faq-title">Ficou com alguma dúvida?</h2><FAQ /></section>
    <section className="landing-final-cta container" aria-labelledby="final-cta-title"><h2 id="final-cta-title">Dê direção à sua preparação para o ENEM.</h2><p>Escolha o plano, acesse os materiais e organize sua rotina de estudos em um só lugar.</p><Link className="ref-button ref-button-primary" href="#planos">Ver planos</Link></section></main><Footer />
    {plans.find((plan) => plan.id === "premium") ? <PremiumOfferModal enabled trigger="manual" delayMs={0} cooldownDays={0} campaignId="premium-2026" checkoutHref={checkoutReady ? "/api/checkout/premium" : "/suporte"} plan={plans.find((plan) => plan.id === "premium")!} /> : null}
  </div>;
}



