import Link from "next/link";
import type { ReactNode } from "react";
import type { CampaignView } from "../../lib/campaign";
import type { DemoQuestion } from "./explorer-types";
import SearchExplorer, { type SearchItem } from "./SearchExplorer";
import TryQuestion from "./TryQuestion";
import TrilhaPreview, { type PreviewUnit } from "./TrilhaPreview";
import { ArtMath, ArtReview, ArtScience, ArtTile } from "./Art";

const Icon = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{children}</svg>
);

export function HeroV2({ hasAccess, studyArea, gratis, view, signupHref }: { hasAccess: boolean; studyArea: string; gratis: boolean; view: CampaignView; signupHref: string }) {
  const primary = hasAccess
    ? <Link className="v2-btn v2-btn-lg" href={studyArea}>Continuar estudando</Link>
    : <a className="v2-btn v2-btn-lg" href="#ofertas">Escolher meu plano</a>;
  return (
    <section className="v2-hero" id="topo" aria-labelledby="s-title">
      <div className="v2-wrap v2-hero-grid">
        <div className="v2-hero-copy">
          <p className="v2-eyebrow">Sua preparação para o ENEM 2027</p>
          <h1 id="s-title">Prepare-se para o <em>ENEM 2027</em> com direção.</h1>
          <p className="v2-lead">Organize seus estudos com trilhas, pratique com questões comentadas e revise seus erros em uma plataforma feita para acompanhar sua evolução.</p>
          <div className="v2-actions">
            {primary}
            {!hasAccess ? <a className="v2-btn v2-btn-outline v2-btn-lg" href="#amostra">Testar uma questão</a> : null}
          </div>
          {!hasAccess && gratis ? <p className="v2-cond"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="11" fill="currentColor" /><path d="m7 12.5 3.3 3.3L17 9" fill="none" stroke="var(--v2-on-accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>Sem cartão</p> : null}
          <p className="s-cal" role="status"><b>{view.label}.</b> {view.calendarConfirmed ? view.detail : "Enquanto não há data oficial, o plano de estudos segue por semanas."}</p>
        </div>
        <div className="v2-hero-visual">
          <span className="v2-blob" aria-hidden="true" />
          <div className="v2-device" role="img" aria-label="Prévia ilustrativa da Trilha ENEM: fundamento e prática concluídos, desafio em andamento e revisão a seguir">
            <div className="v2-device-head"><b>Trilha ENEM</b><span>Prévia ilustrativa</span></div>
            <svg className="v2-ring" viewBox="0 0 80 80" width="92" height="92" aria-hidden="true" focusable="false"><circle cx="40" cy="40" r="32" fill="none" stroke="var(--v2-line)" strokeWidth="9" /><circle cx="40" cy="40" r="32" fill="none" stroke="var(--v2-ring)" strokeWidth="9" strokeLinecap="round" strokeDasharray="201" strokeDashoffset="100" transform="rotate(-90 40 40)" /><text x="40" y="46" textAnchor="middle" className="v2-ring-text">50%</text></svg>
            <ol className="v2-device-steps" aria-hidden="true">
              <li className="is-done"><i />Fundamento</li>
              <li className="is-done"><i />Prática</li>
              <li className="is-now"><i />Desafio</li>
              <li><i />Revisão</li>
            </ol>
          </div>
          <a className="v2-float v2-float-a" href="#trilha"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16ZM8 8h8" /></svg>Trilha ENEM<span aria-hidden="true">›</span></a>
          <a className="v2-float v2-float-b" href="#experimentar"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /></svg>Pratique e evolua<span aria-hidden="true">›</span></a>
          <div className="v2-float v2-float-c">
            <p><b>Seu próximo passo</b><small>Prévia ilustrativa</small></p>
            <a className="v2-btn v2-btn-block" href={hasAccess ? studyArea : "#trilha"}>Continuar trilha<span aria-hidden="true">›</span></a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BenefitStrip() {
  const items: [string, ReactNode][] = [
    ["Trilhas de estudo", <Icon key="a"><path d="m12 3 9 4.5-9 4.5-9-4.5L12 3ZM3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5" /></Icon>],
    ["Questões comentadas", <Icon key="b"><path d="M4 5h16v11H9l-5 4V5ZM8 9.5h8M8 12.5h5" /></Icon>],
    ["Caderno de erros", <Icon key="c"><path d="M5 20V10M12 20V4M19 20v-7" /></Icon>],
    ["Revisão espaçada", <Icon key="d"><path d="M5 5h14v15H5V5ZM5 9h14M9 3v4M15 3v4M9 14l2 2 4-4" /></Icon>],
  ];
  return (
    <section className="v2-strip" aria-label="O que a GoDev oferece">
      <ul className="v2-wrap">{items.map(([label, icon]) => (<li key={label}>{icon}<span>{label}</span></li>))}</ul>
    </section>
  );
}

export function SearchSection({ items, fallbackHref }: { items: SearchItem[]; fallbackHref: string }) {
  return (<section className="v2-section v2-search-section" aria-label="Buscar o que estudar"><div className="v2-wrap"><SearchExplorer items={items} fallbackHref={fallbackHref} /></div></section>);
}

export function MethodSection() {
  const steps: [string, string, ReactNode][] = [
    ["Siga uma trilha", "Estude com um roteiro organizado para o ENEM 2027.", <Icon key="a"><path d="M5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM19 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7 17c5 0 3-8 8-8h2" /></Icon>],
    ["Entenda a resolução", "Veja explicações passo a passo das questões.", <Icon key="b"><path d="M4 5h16v11H9l-5 4V5ZM8 9.5h8" /></Icon>],
    ["Refaça seus erros", "Revise o que errou e fortaleça seus pontos fracos.", <Icon key="c"><path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5" /></Icon>],
    ["Retome de onde parou", "Continue seus estudos no seu ritmo, em qualquer dispositivo.", <Icon key="d"><path d="M7 3h10v18l-5-4-5 4V3Z" /></Icon>],
  ];
  return (
    <section className="v2-section" id="beneficios" aria-labelledby="v2-method-title">
      <div className="v2-wrap v2-method">
        <div className="v2-mosaic" aria-hidden="true">
          {([["trilha", "Trilha", "n"], ["resolucao", "Resolução", "f"], ["erros", "Seus erros", "t"], ["revisao", "Revisão", "a"]] as const).map(([kind, label, tone]) => (
            <div key={kind} className={`v2-tile v2-tile-${tone}`}><ArtTile kind={kind} /><b>{label}</b></div>
          ))}
        </div>
        <div>
          <h2 id="v2-method-title">Aprenda, pratique e acompanhe sua evolução.</h2>
          <ul className="v2-steps">{steps.map(([title, text, icon]) => (<li key={title}><span className="v2-ico">{icon}</span><div><h3>{title}</h3><p>{text}</p></div></li>))}</ul>
        </div>
      </div>
    </section>
  );
}

export type TrilhaCard = { title: string; text: string; tag: string; art: "math" | "science" | "review"; href: string };

export function TrilhasSection({ cards, units, signupHref }: { cards: TrilhaCard[]; units: PreviewUnit[]; signupHref: string | null }) {
  return (
    <section className="v2-section v2-band" id="trilha" aria-labelledby="v2-trilha-title">
      <div className="v2-wrap">
        <header className="v2-head"><h2 id="v2-trilha-title">Conheça sua próxima trilha</h2><p>Planos de estudo completos, focados no que mais cai no ENEM.</p></header>
        <ul className="v2-cards">
          {cards.map((card) => (
            <li key={card.title}>
              <Link href={card.href} className="v2-card-media" tabIndex={-1} aria-hidden="true">
                {card.art === "math" ? <ArtMath /> : card.art === "science" ? <ArtScience /> : <ArtReview />}
                <span className="v2-pill">{card.tag}</span>
              </Link>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <Link className="v2-btn v2-btn-block" href={card.href}>Explorar trilha<span aria-hidden="true">›</span></Link>
            </li>
          ))}
        </ul>
        <TrilhaPreview units={units} signupHref={signupHref} />
        <p className="v2-note">Hoje a trilha cobre Matemática e Natureza; Humanas, Linguagens e Redação entram quando houver atividades aprovadas.</p>
      </div>
    </section>
  );
}

export function ExperienceSection({ question, ctaHref, gratis }: { question: DemoQuestion | undefined; ctaHref: string; gratis: boolean }) {
  if (!question) return null;
  return (
    <section className="v2-section" id="amostra" aria-labelledby="v2-exp-title">
      <div className="v2-wrap">
        <header className="v2-head"><h2 id="v2-exp-title">Veja como é estudar na GoDev.</h2></header>
        <div className="v2-exp">
          <TryQuestion question={question} />
          <aside className="v2-solution" aria-labelledby="v2-sol-title">
            <h3 id="v2-sol-title"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="11" fill="currentColor" /><path d="m7 12.5 3.3 3.3L17 9" fill="none" stroke="var(--v2-on-accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>Entenda a solução</h3>
            <div className="v2-solution-body" dangerouslySetInnerHTML={{ __html: question.resolutionHtml }} />
            <p className="v2-solution-mis"><b>Erro comum:</b> {question.misconception}</p>
            <a className="v2-btn" href={ctaHref} data-signup={gratis ? "amostra" : undefined}>{gratis ? "Começar a estudar grátis" : "Ver os planos"}<span aria-hidden="true">›</span></a>
          </aside>
        </div>
      </div>
    </section>
  );
}
