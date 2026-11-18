import "../../app/landing-sales.css";
import { Header, Footer } from "../../components/site";
import CheckoutParams from "./CheckoutParams";
import SalesSticky from "./SalesSticky";
import { SalesAccess, SalesFaq, SalesFinal, SalesHero, SalesNumbers, SalesOffers, SalesSamples, SalesStrip, SalesTools } from "./SalesSections";
import { ebookMaterials } from "../../lib/ebook-catalog";
import "../../app/landing-plus.css";
import { brl, SERVICE_FEE_CENTS } from "../../lib/pricing";
import { publicPlans } from "../../lib/catalog";
import { checkoutConfigured } from "../../lib/readiness";
import { inventory } from "../../lib/inventory";
import { campaign, campaignView } from "../../lib/campaign";
import { campaignFacts } from "../../lib/operacao/campaign-facts";
import { demoQuestions } from "../../lib/explorer-data";
import { canAccess } from "../../lib/supabase";

export default async function LandingPage() {
  const plans = await publicPlans();
  const checkoutReady = checkoutConfigured();
  const view = campaignView();
  const facts = campaignFacts();
  const inv = inventory();
  // Quem já tem acesso vê "Continuar minha revisão"; falha na consulta nunca quebra a landing.
  const hasAccess = view.active ? Boolean(await canAccess("essencial").catch(() => null)) : false;
  const cents = (id: string) => plans.find((plan) => plan.id === id)?.cents ?? 0;
  const essencialTotal = brl(cents("essencial") + SERVICE_FEE_CENTS);
  const premiumTotal = brl(cents("premium") + SERVICE_FEE_CENTS);
  const demos = demoQuestions();
  const heroQuestion = demos.find((item) => item.disc === "matematica");
  // A amostra comentada usa outra disciplina, para a página não repetir a mesma questão.
  const question = demos.find((item) => item.disc === "fisica") ?? demos.find((item) => item.id !== heroQuestion?.id) ?? heroQuestion;
  return (
    <div className="sales">
      <CheckoutParams />
      {hasAccess
        ? <SalesSticky href={campaign.destinations.studyArea} label="CONTINUAR MINHA REVISÃO" />
        : <SalesSticky href="#ofertas" label="QUERO ESCOLHER MEU PLANO" note={`Planos a partir de ${essencialTotal} no total`} />}
      <SalesStrip view={view} />
      <Header />
      <main id="conteudo">
        <SalesHero hasAccess={hasAccess} studyArea={campaign.destinations.studyArea} essencialTotal={essencialTotal} question={heroQuestion} />
        <SalesNumbers facts={facts} inv={inv} ebooks={ebookMaterials.length} />
        <SalesSamples question={question} />
        <SalesTools facts={facts} inv={inv} />
        <SalesOffers plans={plans} facts={facts} inv={inv} checkoutReady={checkoutReady} />
        <SalesAccess />
        <SalesFaq inv={inv} essencialTotal={essencialTotal} premiumTotal={premiumTotal} essencialBase={brl(cents("essencial"))} premiumBase={brl(cents("premium"))} />
        <SalesFinal message={view.active && view.countdown ? view.countdown : "Pronto para começar a sua revisão?"} />
      </main>
      <Footer />
    </div>
  );
}
