import "../../app/landing-sales.css";
import { Header, Footer } from "../../components/site";
import CheckoutParams from "./CheckoutParams";
import SalesSticky from "./SalesSticky";
import { SalesAccess, SalesFaq, SalesFinal, SalesHero, SalesNumbers, SalesOffers, SalesSamples, SalesStrip, SalesTools, SalesTrilha } from "./SalesSections";
import LandingEvents from "./LandingEvents";
import { modules, questions, toPublic } from "../../lib/operacao/catalog";
import { UNITS } from "../../lib/trilha/service";
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
import { features } from "../../lib/features";
import { pixReadiness } from "../../lib/pix/readiness";
import { freeScope } from "../../lib/planos/free";

export default async function LandingPage() {
  const plans = await publicPlans();
  const checkoutReady = checkoutConfigured();
  const view = campaignView();
  const facts = campaignFacts();
  const inv = inventory();
  // Quem já tem acesso vê "Continuar minha revisão"; falha na consulta nunca quebra a landing.
  const hasAccess = view.active ? Boolean(await canAccess("essencial").catch(() => null)) : false;
  const pixReady = await pixReadiness();
  const freeUnitId = features.gratis ? freeScope().unitId : null;
  // Prévia da Trilha: 3 unidades reais (a primeira é a do Grátis, quando ativo) e, em cada uma, o enunciado de uma questão real do acervo.
  const previewUnits = UNITS.slice(0, 3).map((u) => {
    const sample = questions.find((q) => q.moduleId === u.moduleId);
    const unitModule = modules.find((m) => m.id === u.moduleId);
    return { id: u.id, title: u.title, objective: unitModule?.objective ?? u.objective, minutes: u.minutes, exampleHtml: sample ? toPublic(sample).statementHtml : null, tier: (freeUnitId && u.id === freeUnitId ? "gratis" : "essencial") as "gratis" | "essencial" };
  });
  const scope = features.gratis ? freeScope() : null;
  const freeUnit = scope ? UNITS.find((u) => u.id === scope.unitId) : null;
  const free = scope && freeUnit ? { unitTitle: freeUnit.title, questionsPerDay: scope.questionsPerDay } : undefined;
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
      <LandingEvents />
      {hasAccess
        ? <SalesSticky href={campaign.destinations.studyArea} label="Continuar estudando" />
        : features.gratis
          ? <SalesSticky href="/entrar?modo=cadastro" label="Começar grátis" note="Sem cartão" signup />
          : <SalesSticky href="#ofertas" label="Ver planos" note={`Planos a partir de ${essencialTotal} no total`} />}
      <SalesStrip view={view} />
      <Header />
      <main id="conteudo">
        <SalesHero hasAccess={hasAccess} studyArea={campaign.destinations.studyArea} question={heroQuestion} view={view} gratis={features.gratis} />
        <SalesNumbers facts={facts} inv={inv} ebooks={ebookMaterials.length} />
        <SalesTrilha signupHref={features.gratis ? "/entrar?modo=cadastro&redirect=%2Faluno%2Ftrilha" : null} units={previewUnits} />
        <SalesSamples question={question} />
        <SalesTools facts={facts} inv={inv} />
        <SalesOffers plans={plans} facts={facts} inv={inv} checkoutReady={checkoutReady} free={free} pixReady={{ essencial: pixReady.essencial, premium: pixReady.premium }} />
        <SalesAccess />
        <SalesFaq inv={inv} essencialTotal={essencialTotal} premiumTotal={premiumTotal} essencialBase={brl(cents("essencial"))} premiumBase={brl(cents("premium"))} />
        <SalesFinal message={view.active && view.countdown ? view.countdown : "Pronto para começar a sua preparação?"} />
      </main>
      <Footer />
    </div>
  );
}
