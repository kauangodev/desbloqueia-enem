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
      {facts.questions} questões comentadas, {facts.modules} revisões rápidas e {facts.simulados} simulados de {facts.simuladoQuestions} questões em Matemática, Física, Química e Biologia. Incluído nos planos Essencial e Premium.
    </p>
  );
}

/** "Uma reta final com direção": jornada em 4 passos + prévia interativa. */
export function CampaignJourney({ view, hasAccess }: { view: CampaignView; facts: Facts; hasAccess: boolean }) {
  return (
    <section className="cp-section container" id="reta-final" aria-labelledby="cp-title">
      <div className="cp-head">
        <span className="landing-eyebrow">{view.active ? view.label : "Operação 2º Domingo"}</span>
        <h2 id="cp-title">Como ter acesso</h2>
      </div>
      <div className="cp-split">
        <aside className="cp-access" aria-label="Como ter acesso">
          <h3>Em 3 passos</h3>
          <ul>
            <li>Incluída nos planos <strong>Essencial</strong> e <strong>Premium</strong>, sem custo extra.</li>
            <li>Depois do pagamento confirmado, entre com o e-mail usado na compra.</li>
            <li>A área fica em <strong>Operação 2º Domingo</strong>, no menu do aluno.</li>
          </ul>
          <div className="cp-access-actions">{hasAccess
            ? <Link className="ref-button ref-button-primary ref-button-hot" href={campaign.destinations.studyArea} data-analytics-event="campaign_access_continue">Continuar minha revisão</Link>
            : <><Link className="ref-button ref-button-primary ref-button-hot" href={campaign.destinations.offer} data-analytics-event="campaign_journey_cta">Ver planos e acesso</Link><Link className="cp-login" href={campaign.destinations.login}>Já tenho acesso: entrar</Link></>}</div>
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
