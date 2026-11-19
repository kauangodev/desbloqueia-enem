import "../../app/landing-sales.css";
import { Header, Footer } from "../../components/site";
import CheckoutParams from "./CheckoutParams";
import SalesSticky from "./SalesSticky";
import { SalesAccess, SalesFaq, SalesOffers, SalesStrip } from "./SalesSections";
import { BenefitStrip, ExperienceSection, HeroV2, MethodSection, SearchSection, TrilhasSection, type TrilhaCard } from "./V2Sections";
import type { SearchItem } from "./SearchExplorer";
import LandingEvents from "./LandingEvents";
import { modules, questions, toPublic } from "../../lib/operacao/catalog";
import { UNITS } from "../../lib/trilha/service";
import "../../app/landing-plus.css";
import "../../app/landing-v2.css";
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
  const signupHref = "/entrar?modo=cadastro";
  const trilhaSignup = "/entrar?modo=cadastro&redirect=%2Faluno%2Ftrilha";
  const exploreHref = features.gratis ? trilhaSignup : "#trilha";
  // Catálogo PÚBLICO para a busca: disciplinas cobertas e unidades reais da Trilha (nada de conteúdo pago).
  const searchItems: SearchItem[] = [
    { label: "Matemática", kind: "Disciplina · Trilha ENEM", href: exploreHref },
    { label: "Ciências da Natureza", kind: "Disciplina · Trilha ENEM", href: exploreHref },
    ...UNITS.map((u) => ({ label: u.title, kind: "Unidade da Trilha", href: exploreHref })),
  ];
  const trilhaCards: TrilhaCard[] = [
    { title: "Matemática", text: "Do básico à resolução de questões do ENEM, com foco no que mais cai.", tag: "Trilha", image: "/covers/editorial-v3/matematica.jpg", href: exploreHref },
    { title: "Ciências da Natureza", text: "Conteúdos de Biologia, Química e Física integrados com questões do ENEM.", tag: "Trilha", image: "/covers/editorial-v3/natureza.jpg", href: exploreHref },
    { title: "Revisão inteligente", text: "Revisões direcionadas, resumos objetivos e questões para fixar o conteúdo.", tag: "Revisão", image: "/amostras/mat-p07.webp", href: exploreHref },
  ];
  const demos = demoQuestions();
  const heroQuestion = demos.find((item) => item.disc === "matematica");
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
        <HeroV2 hasAccess={hasAccess} studyArea={campaign.destinations.studyArea} gratis={features.gratis} view={view} signupHref={signupHref} />
        <BenefitStrip />
        <SearchSection items={searchItems} fallbackHref={features.gratis ? signupHref : "#trilha"} />
        <MethodSection />
        <TrilhasSection cards={trilhaCards} units={previewUnits} signupHref={features.gratis ? trilhaSignup : null} />
        <ExperienceSection question={heroQuestion} ctaHref={features.gratis ? trilhaSignup : "#ofertas"} gratis={features.gratis} />
        <SalesOffers plans={plans} facts={facts} inv={inv} checkoutReady={checkoutReady} free={free} pixReady={{ essencial: pixReady.essencial, premium: pixReady.premium }} />
        <SalesAccess />
        <SalesFaq inv={inv} essencialTotal={essencialTotal} premiumTotal={premiumTotal} essencialBase={brl(cents("essencial"))} premiumBase={brl(cents("premium"))} />
      </main>
      <Footer />
    </div>
  );
}
