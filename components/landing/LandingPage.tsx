import Link from "next/link";
import { Header, Footer, MaterialPreview, FAQ } from "../../components/site";
import { HeroProductPreview } from "./HeroProductPreview";
import { money } from "../../lib/config";
import { publicPlans } from "../../lib/catalog";
import { checkoutConfigured } from "../../lib/readiness";
import { questionBank, toPublicQuestion } from "../../data/question-bank";

const areas = ["Linguagens e suas Tecnologias", "Matemática e suas Tecnologias", "Ciências da Natureza", "Ciências Humanas", "Redação"];
const steps = [["Escolha", "Selecione a disciplina e o tema que você quer estudar."], ["Pratique", "Resolva questões, simulados e listas focadas no ENEM."], ["Revise", "Veja explicações claras e retome os pontos que precisa reforçar."]];

export default async function LandingPage() {
  const plans = await publicPlans();
  const checkoutReady = checkoutConfigured();
  const demoQuestion = toPublicQuestion(questionBank[0]);
  return <>
    <Header />
    <main id="conteudo" className="reformulated-landing">
      <section className="landing-hero container" aria-labelledby="landing-title"><span className="landing-eyebrow">Desbloqueia ENEM 2026</span><h1 id="landing-title">Prepare-se para o ENEM 2026 com método e clareza.</h1><p>Questões, simulados e e-books organizados para você estudar de forma objetiva, no seu ritmo, com foco no que realmente importa.</p><div className="landing-actions"><Link className="ref-button ref-button-primary" href="#demo-questao">Experimentar uma questão <span aria-hidden="true">→</span></Link><Link className="ref-button ref-button-link" href="#planos">Conhecer os planos</Link></div></section>
      <section className="landing-demo container" aria-label="Demonstração da plataforma"><div className="demo-sidebar" aria-label="Módulos demonstrados"><strong>GoDev</strong>{["Resolver questões", "Simulados", "Listas de exercícios", "E-books", "Meu progresso"].map((item, index) => <span className={index === 0 ? "is-active" : ""} key={item}>{item}</span>)}</div><HeroProductPreview question={demoQuestion} demoAnswer={questionBank[0].answer} demoExplanation={questionBank[0].explanation} demoNextStep={questionBank[0].nextStep} /><aside className="demo-aside" aria-label="Status da demonstração"><span className="demo-tab is-active">Questão</span><span className="demo-tab">Resolução</span><div className="demo-status"><span /> Não respondida</div><div className="demo-status"><span className="answered" /> Respondida</div><div className="demo-number-grid">{Array.from({ length: 10 }, (_, i) => <span key={i} className={i === 0 ? "is-active" : ""}>{i + 1}</span>)}</div><Link className="ref-button ref-button-primary" href="#demo-questao">Verificar resposta</Link></aside></section>
      <section className="landing-steps container" aria-label="Como funciona">{steps.map(([title, body], index) => <article key={title}><span className="step-number">{index + 1}</span><h2>{title}</h2><p>{body}</p></article>)}</section>
      <section className="landing-areas container" aria-labelledby="areas-title"><h2 id="areas-title">Todas as áreas do ENEM, em um só lugar.</h2><div className="area-grid">{areas.map((area) => <div key={area}><span className="area-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M5 4.5h14v15H5zM8 8h8M8 12h8M8 16h5" /></svg></span><span>{area}</span></div>)}</div></section>
      <section className="landing-materials" id="materiais" aria-labelledby="materials-title"><div className="container materials-intro"><div><span className="landing-eyebrow">E-books</span><h2 id="materials-title">Materiais completos para aprofundar o seu estudo.</h2><p>Conteúdos organizados, objetivos e alinhados com o que mais cai no ENEM.</p><Link className="ref-button ref-button-link" href="#catalogo">Ver todos os e-books <span aria-hidden="true">→</span></Link></div><div className="material-covers" aria-hidden="true"><span>Guia da<br />Redação ENEM</span><span>Interpretação<br />de Textos ENEM</span><span>Matemática<br />no ENEM</span></div></div><div className="landing-stat-strip container"><span>2.100 questões</span><i /> <span>30 simulados</span><i /> <span>16 e-books</span></div><div id="catalogo" className="container catalog-wrap"><MaterialPreview /></div></section>
      <section className="landing-pricing" id="planos" aria-labelledby="plans-title"><div className="container"><span className="landing-eyebrow">Planos</span><h2 id="plans-title">Escolha o plano ideal para a sua jornada.</h2><div className="ref-pricing-grid">{plans.map((plan) => <article key={plan.id} className={`ref-price-card ${plan.id === "premium" ? "is-premium" : ""}`}>{plan.id === "premium" && <span className="ref-badge">Mais completo</span>}<h3>{plan.name}</h3><ul>{plan.features.map((feature) => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}</ul><div className="ref-price">{money(plan.cents)}<small>pagamento único</small></div><Link className="ref-button ref-button-primary" href={checkoutReady ? `/api/checkout/${plan.id}` : "/suporte"}>{checkoutReady ? `Quero o ${plan.name}` : "Falar com atendimento"}</Link></article>)}</div><div className="ref-guarantee"><strong>◉ 7 dias de garantia</strong><span>Compre com tranquilidade. Consulte as condições de reembolso e acesso.</span><Link href="/politicas/reembolso">Ler a política</Link></div></div></section>
      <section className="landing-faq container" id="duvidas" aria-labelledby="faq-title"><span className="landing-eyebrow">Dúvidas frequentes</span><h2 id="faq-title">Ficou com alguma dúvida?</h2><FAQ /></section>
    </main><Footer />
  </>;
}

