import Link from "next/link";
import { campaign, type CampaignView } from "../../lib/campaign";
import type { campaignFacts } from "../../lib/operacao/campaign-facts";

type Facts = ReturnType<typeof campaignFacts>;

/** Selo + prazo no topo da hero (uma única linha; sem banner concorrente). */
export function CampaignHeroLead({ view }: { view: CampaignView }) {
  if (!view.active) return null;
  return (
    <p className="cp-lead">
      <span className="cp-badge">{view.label}</span>
      {view.countdown ? <span className="cp-countdown">{view.countdown}</span> : null}
    </p>
  );
}

/** Benefício concreto da hero, com números reais do acervo publicado. */
export function CampaignHeroFacts({ view, facts }: { view: CampaignView; facts: Facts }) {
  if (!view.active) return null;
  return (
    <p className="cp-facts">
      {facts.questions} questões comentadas, {facts.modules} módulos de revisão e {facts.simulados} simulados de {facts.simuladoQuestions} questões em Matemática, Física, Química e Biologia. Incluído nos planos Essencial e Premium.
    </p>
  );
}

/** "Uma reta final com direção": jornada em 4 passos + prévia interativa. */
export function CampaignJourney({ view, facts, hasAccess }: { view: CampaignView; facts: Facts; hasAccess: boolean }) {
  const steps = [
    { title: "Revise os conceitos", text: `${facts.modules} módulos objetivos e ${facts.formulas} fichas de fórmulas e conceitos, com exemplos resolvidos.` },
    { title: "Pratique com questões", text: `${facts.questions} questões comentadas: ${facts.byDiscipline.matematica} de Matemática, ${facts.byDiscipline.fisica} de Física, ${facts.byDiscipline.quimica} de Química e ${facts.byDiscipline.biologia} de Biologia.` },
    { title: "Entenda seus erros", text: "Cada resposta traz a resolução e o motivo do erro mais comum. As questões erradas vão para o seu caderno de erros." },
    { title: "Teste sua preparação", text: `${facts.simulados} simulados de ${facts.simuladoQuestions} questões e ${facts.treinos} treinos de ${facts.treinoQuestions}, com tempo de referência e correção ao final.` },
  ];
  return (
    <section className="cp-section container" id="reta-final" aria-labelledby="cp-title">
      <div className="cp-head">
        <span className="landing-eyebrow">{view.active ? view.label : "Operação 2º Domingo"}</span>
        <h2 id="cp-title">{view.journeyTitle}</h2>
        <p>
          {view.active
            ? "Matemática e Ciências da Natureza reunidas em uma única área de estudos, para você distribuir revisão, prática e correção até o segundo dia."
            : "A área de estudos de Matemática e Ciências da Natureza continua disponível para revisão e para a próxima etapa."}
        </p>
        <p className="cp-fine">É uma seleção de estudo: não prevê nem garante o que será cobrado na prova.</p>
      </div>
      <ol className="cp-steps">
        {steps.map((step, index) => (
          <li key={step.title}><span className="cp-step-num" aria-hidden="true">{index + 1}</span><strong>{step.title}</strong><p>{step.text}</p></li>
        ))}
      </ol>
      <div className="cp-split">
        <aside className="cp-access" aria-label="Como ter acesso">
          <h3>Como ter acesso</h3>
          <ul>
            <li>Incluída nos planos <strong>Essencial</strong> e <strong>Premium</strong>, sem custo extra.</li>
            <li>Depois do pagamento confirmado, entre com o e-mail usado na compra.</li>
            <li>A área fica em <strong>Operação 2º Domingo</strong>, no menu do aluno.</li>
          </ul>
          <div className="cp-access-actions">{hasAccess
            ? <Link className="ref-button ref-button-primary ref-button-hot" href={campaign.destinations.studyArea} data-analytics-event="campaign_access_continue">Continuar minha revisão</Link>
            : <><Link className="ref-button ref-button-primary" href={campaign.destinations.offer} data-analytics-event="campaign_journey_cta">Ver planos e acesso</Link><Link className="cp-login" href={campaign.destinations.login}>Já tenho acesso: entrar</Link></>}</div>
        </aside>
      </div>
    </section>
  );
}

/** Nota na região dos planos: só afirma o que o código de acesso garante (Essencial e Premium). */
export function CampaignOfferNote({ view, facts }: { view: CampaignView; facts: Facts }) {
  if (!view.active) return null;
  return (
    <p className="cp-offer-note">
      <strong>{view.label}:</strong> a Operação 2º Domingo ({facts.questions} questões comentadas, {facts.simulados} simulados e {facts.treinos} treinos) está incluída nos dois planos. Preços e condições abaixo não mudam.
    </p>
  );
}
