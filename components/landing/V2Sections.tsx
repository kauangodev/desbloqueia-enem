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

const GLASS: [string, string, string, ReactNode][] = [
  ["a", "Trilhas de estudo", "Saiba por onde começar", <Icon key="a"><path d="M5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM19 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7 17c5 0 3-8 8-8h2" /></Icon>],
  ["b", "Questões comentadas", "Entenda cada resposta", <Icon key="b"><path d="M4 5h16v11H9l-5 4V5ZM8 9.5h8M8 12.5h5" /></Icon>],
  ["c", "Caderno de erros", "Revise o que precisa", <Icon key="c"><path d="M7 3h10v18l-5-4-5 4V3Z" /></Icon>],
  ["d", "Revisão espaçada", "Reforce o que aprendeu", <Icon key="d"><path d="M5 5h14v15H5V5ZM5 9h14M9 3v4M15 3v4M9 14l2 2 4-4" /></Icon>],
];
export function HeroV2({ hasAccess, studyArea, gratis, view, signupHref }: { hasAccess: boolean; studyArea: string; gratis: boolean; view: CampaignView; signupHref: string }) {
  const primary = hasAccess
    ? <Link className="v2-btn v2-btn-lg" href={studyArea}>Continuar estudando</Link>
    : <a className="v2-btn v2-btn-lg" href="#ofertas">Escolher meu plano</a>;
  return (
    <section className="v2-hero" id="topo" aria-labelledby="s-title">
      <div className="v2-wrap v2-hero-grid">
        <div className="v2-hero-copy">
          <p className="v2-eyebrow">Sua preparação para o ENEM 2027</p>
          <h1 id="s-title">Prepare-se para o <em>ENEM 2027</em> com mais direção.</h1>
          <p className="v2-lead">Trilhas de estudo, questões comentadas e revisão para você evoluir no seu ritmo.</p>
          <div className="v2-actions">
            {primary}
            {!hasAccess ? <a className="v2-btn v2-btn-outline v2-btn-lg" href="#amostra">Testar uma questão</a> : null}
          </div>
          {!hasAccess && gratis ? <p className="v2-cond"><Link href={signupHref} data-signup="hero-gratis">Conheça o plano gratuito</Link><span>Sem cartão</span></p> : null}
          <p className="s-cal" role="status"><b>{view.label}.</b> {view.calendarConfirmed ? view.detail : "Enquanto não há data oficial, o plano de estudos segue por semanas."}</p>
        </div>
        <div className="gh-visual">
          <span className="gh-glow" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="gh-person" src="/hero/personagem-793.webp" srcSet="/hero/personagem-480.webp 480w, /hero/personagem-793.webp 793w" sizes="(max-width: 900px) 240px, 380px" width="793" height="1560" alt="" fetchPriority="high" decoding="async" />
          <ul className="gh-cards">
            {GLASS.map(([k, title, sub, icon]) => (
              <li key={k} className={`gh-card gh-card-${k}`}><span className="gh-ico">{icon}</span><b>{title}</b><small>{sub}</small></li>
            ))}
          </ul>
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
        <header className="v2-head"><h2 id="v2-exp-title">Veja como seu estudo acontece na GoDev.</h2></header>
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

