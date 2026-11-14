import Link from "next/link";
import { Header, Footer, FAQ } from "../../components/site";
import HeroExplorer from "./HeroExplorer";
import CheckoutParams from "./CheckoutParams";
import StickyBuy from "./StickyBuy";
import { AnnouncementStrip, DeliveryNote, HeroAnswers, PlanCompare, TodayPath } from "./ConversionSections";
import OpenSampleLink from "./OpenSampleLink";
import { brl, planBaseCents, planTotalCents, SERVICE_FEE_CENTS } from "../../lib/pricing";
import { ebookMaterials } from "../../lib/ebook-catalog";
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
import { CampaignHeroLead, CampaignJourney, CampaignOfferNote } from "./CampaignSections";


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
    {view.active && hasAccess ? <StickyBuy href={campaign.destinations.studyArea} label="Continuar minha revisão" /> : view.active && checkoutReady ? <StickyBuy href="/api/checkout/premium" label={`Quero o Premium · ${brl(planTotalCents("premium"))}`} alert={view.countdown ?? undefined} /> : null}
    <AnnouncementStrip view={view} />
    <Header />
    <main id="conteudo" className="reformulated-landing landing-light">
      <section className="landing-hero container petroleum-hero" aria-labelledby="landing-title">
        <div className="petroleum-hero-copy"><CampaignHeroLead view={view} /><h1 id="landing-title">{view.headline} <em>{view.emphasis}</em></h1><p className="hero-sub">{view.active ? "Questões comentadas, treinos, simulados e revisões de Matemática e Natureza para o 2º dia do Enem. Pagamento único." : view.support}</p><div className="landing-actions">{view.active && hasAccess ? <Link className="ref-button ref-button-primary ref-button-hot" href={campaign.destinations.studyArea} data-analytics-event="campaign_hero_cta">Continuar minha revisão</Link> : view.active && checkoutReady ? <a className="ref-button ref-button-primary ref-button-hot" href="/api/checkout/premium" data-analytics-event="campaign_hero_cta">{`Quero o Premium · ${brl(planTotalCents("premium"))}`}</a> : <Link className="ref-button ref-button-primary" href="#planos" data-analytics-event={view.active ? "campaign_hero_cta" : undefined}>{view.primaryCta}</Link>}{view.active && !hasAccess && checkoutReady ? <a className="ref-button ref-button-link ref-button-ghost" href="/api/checkout/essencial">{`Essencial · ${brl(planTotalCents("essencial"))}`}</a> : null}<Link className="ref-button ref-button-link" href="#comparar">Comparar planos</Link></div>{!hasAccess ? <p className="hero-trust">Pix ou cartão no checkout seguro da Cakto · 7 dias de garantia · material independente, sem vínculo com INEP ou MEC</p> : null}{view.active ? <HeroAnswers essencial={brl(planTotalCents("essencial"))} premium={brl(planTotalCents("premium"))} /> : null}</div>
        <HeroExplorer data={explorer} />
      </section>
      {view.active ? <TodayPath /> : null}
      <PlanCompare facts={facts} essencialTotal={brl(planTotalCents("essencial"))} premiumTotal={brl(planTotalCents("premium"))} essencialBase={brl(planBaseCents("essencial"))} premiumBase={brl(planBaseCents("premium"))} fee={brl(SERVICE_FEE_CENTS)} essencialBooks={ebookMaterials.filter((b) => b.plan === "essencial").map((b) => b.title)} premiumBooks={ebookMaterials.length} />
      <section className="landing-pricing" id="planos" aria-labelledby="plans-title"><div className="container"><span className="landing-eyebrow">Planos</span><h2 id="plans-title">{view.active ? "Escolha como chegar preparado no domingo." : "Escolha o seu plano."}</h2><CampaignOfferNote view={view} facts={facts} /><div className="ref-pricing-grid">{[...plans].sort((a, b) => (a.id === "premium" ? -1 : b.id === "premium" ? 1 : 0)).map((plan) => <article key={plan.id} className={`ref-price-card ${plan.id === "premium" ? "is-premium" : ""}`}>{plan.id === "premium" && <span className="ref-badge">Recomendado · mais completo</span>}<h3>{plan.name}</h3><ul>{plan.features.map((feature) => <li key={feature}><span aria-hidden="true" />{feature}</li>)}</ul><div className="ref-price">{money(plan.cents)}<small>pagamento único</small></div><p className="ref-total">+ {brl(SERVICE_FEE_CENTS)} de taxa = <b>{brl(plan.cents + SERVICE_FEE_CENTS)}</b> no total</p>{checkoutReady ? <><a className="ref-button ref-button-primary ref-button-hot" href={`/api/checkout/${plan.id}`}>{`Quero o ${plan.name} · ${brl(plan.cents + SERVICE_FEE_CENTS)}`}</a><p className="ref-assure">Pix ou cartão · 7 dias de garantia</p></> : <Link className="ref-button ref-button-primary" href="/suporte">Falar com atendimento</Link>}</article>)}</div><DeliveryNote /><p className="ref-fee-note">O total mostrado já inclui a taxa de serviço de R$ 0,99 do checkout da Cakto: é o valor que você vê na tela de pagamento.</p><div className="ref-guarantee"><span className="ref-guarantee-mark" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="m5 12 4 4L19 6" /></svg></span><div className="ref-guarantee-copy"><strong>7 dias de garantia</strong><span>Compre com tranquilidade. Consulte as condições de reembolso e acesso.</span></div><Link href="/politicas/reembolso">Ler a política</Link></div></div></section>
      <CampaignJourney view={view} facts={facts} hasAccess={hasAccess} />
      <section className="landing-materials" id="materiais" aria-labelledby="materials-title"><div className="container materials-intro"><div><span className="landing-eyebrow">E-books</span><h2 id="materials-title">E-books para revisar rápido.</h2><p>Conteúdos organizados e objetivos, para consultar no celular quando der.</p><OpenSampleLink /></div><LandingMaterialCarousel /></div><div className="landing-stat-strip container"><span>16 e-books</span><i /> <span>{facts.questions} questões comentadas de Matemática e Natureza</span><i /> <span>{facts.simulados} simulados de {facts.simuladoQuestions} questões</span><i /> <span>{inv.simulados} simulados e {inv.lists} listas do banco geral</span></div></section>
      <section className="landing-faq container" id="duvidas" aria-labelledby="faq-title"><span className="landing-eyebrow">Dúvidas frequentes</span><h2 id="faq-title">Ficou com alguma dúvida?</h2><FAQ /></section>
    <section className="landing-final-cta container" aria-labelledby="final-cta-title"><h2 id="final-cta-title">{view.active && view.countdown ? view.countdown : "Comece pela primeira questão hoje."}</h2><p>Escolha o plano, entre na área de estudos e treine Matemática e Natureza antes de domingo.</p><Link className="ref-button ref-button-primary ref-button-hot" href="#planos">Ver planos</Link></section></main><Footer />
    {plans.find((plan) => plan.id === "premium") ? <PremiumOfferModal enabled trigger="manual" delayMs={0} cooldownDays={0} campaignId="premium-2026" checkoutHref={checkoutReady ? "/api/checkout/premium" : "/suporte"} plan={plans.find((plan) => plan.id === "premium")!} /> : null}
  </div>;
}



