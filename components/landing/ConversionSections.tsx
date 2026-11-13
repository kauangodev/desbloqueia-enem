import type { CampaignView } from "../../lib/campaign";
import type { campaignFacts } from "../../lib/operacao/campaign-facts";

type Facts = ReturnType<typeof campaignFacts>;

/** Faixa de urgência real (data do Enem), no topo da página. */
export function AnnouncementStrip({ view }: { view: CampaignView }) {
  if (!view.active) return null;
  const left = view.daysLeft > 1 ? `Faltam ${view.daysLeft} dias` : view.daysLeft === 1 ? "Falta 1 dia" : "É hoje";
  return (
    <a className="hot-strip" href="#planos" data-analytics-event="strip_cta">
      <i aria-hidden="true" />
      <span><b>Enem é domingo</b> · {left} · Garanta seu acesso</span>
      <em aria-hidden="true">→</em>
    </a>
  );
}

/** Prova em números reais do acervo publicado (sem depoimentos inventados). */
export function ProofStrip({ facts }: { facts: Facts }) {
  const items = [
    { n: facts.questions, label: "questões comentadas" },
    { n: facts.simulados, label: `simulados de ${facts.simuladoQuestions} questões` },
    { n: facts.treinos, label: `treinos de ${facts.treinoQuestions} questões` },
    { n: facts.modules, label: "revisões rápidas" },
  ];
  return (
    <section className="cv-proof container" aria-label="O que está incluído, em números">
      <ul>
        {items.map((item) => (
          <li key={item.label}><b>{item.n}</b><span>{item.label}</span></li>
        ))}
      </ul>
    </section>
  );
}

/** "Tudo o que você vai receber": itens concretos, cada um com o ganho prático. */
export function WhatYouGet({ facts }: { facts: Facts }) {
  const cards = [
    { icon: "M9 11l2 2 4-4M5 4h14v16H5V4Z", title: `${facts.questions} questões comentadas`, text: "Matemática, Física, Química e Biologia, cada uma com a resolução passo a passo.", points: [`${facts.byDiscipline.matematica} de Matemática`, `${facts.byDiscipline.fisica} de Física, ${facts.byDiscipline.quimica} de Química e ${facts.byDiscipline.biologia} de Biologia`] },
    { icon: "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM9 1h6", title: `${facts.simulados} simulados de ${facts.simuladoQuestions} questões`, text: "Treine o ritmo da prova com tempo de referência e correção ao final.", points: [`${facts.simuladoQuestions / 2} de Matemática e ${facts.simuladoQuestions / 2} de Natureza`, "Resultado por área"] },
    { icon: "M13 2 4 14h7l-1 8 9-12h-7l1-8Z", title: `${facts.treinos} treinos de ${facts.treinoQuestions} questões`, text: "Sessões curtas para encaixar no seu dia, sem precisar de horas livres.", points: ["Prática focada por disciplina", "Correção na hora"] },
    { icon: "M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16ZM8 7h8M8 11h6", title: `${facts.modules} revisões rápidas`, text: "Os conceitos de cada tema em cerca de 25 a 30 minutos, com exemplo resolvido.", points: [`${facts.formulas} fichas de fórmulas e conceitos`, "Para consultar antes da prova"] },
    { icon: "M3 7l9-4 9 4v10l-9 4-9-4V7Zm9 4v10M3 7l9 4 9-4", title: "Caderno de erros", text: "Cada questão errada vai para o seu caderno, com o motivo do erro mais comum, para você refazer.", points: ["Você volta e usa de novo", "Entende o erro, não só o gabarito"] },
    { icon: "M5 21V4m0 0h11l-2 4 2 4H5", title: "Cronograma e mapa da revisão", text: "Veja o que revisar e quando, distribuindo o estudo pelos dias que faltam até domingo.", points: ["Tudo organizado em um só lugar", "Leitura no celular, tablet ou computador"] },
  ];
  return (
    <section className="cv-section container" id="inclui" aria-labelledby="cv-inclui-title">
      <div className="cv-head">
        <span className="landing-eyebrow">Incluído nos dois planos</span>
        <h2 id="cv-inclui-title">Tudo o que você vai receber</h2>
        <p>Matemática e Natureza, o conteúdo do segundo dia do Enem, organizado para você praticar e revisar rápido.</p>
      </div>
      <ul className="cv-grid">
        {cards.map((card) => (
          <li key={card.title} className="cv-card">
            <span className="cv-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false"><path d={card.icon} /></svg></span>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
            <ul className="cv-points">{card.points.map((point) => <li key={point}>{point}</li>)}</ul>
          </li>
        ))}
      </ul>
      <p className="cv-fine">Material de estudo independente, sem vínculo com o INEP ou o MEC. Não prevê nem garante o que será cobrado na prova.</p>
    </section>
  );
}

/** "Para quem é": a dor real do estudante, em frases curtas. */
export function ForWho() {
  const items = [
    ["Faz o Enem no domingo", "e quer treinar Matemática e Natureza antes da prova."],
    ["Tem pouco tempo", "e precisa saber por onde começar nos últimos dias."],
    ["Quer entender os próprios erros", "e não só ver o gabarito."],
    ["Estuda pelo celular", "em sessões curtas, quando dá."],
    ["Quer simular a prova", "com tempo de referência e correção ao final."],
  ];
  return (
    <section className="cv-section cv-forwho container" aria-labelledby="cv-forwho-title">
      <div className="cv-head">
        <span className="landing-eyebrow">Para quem é</span>
        <h2 id="cv-forwho-title">Feito para quem está na reta final</h2>
      </div>
      <ul className="cv-list">
        {items.map(([strong, rest]) => (
          <li key={strong}><span aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" focusable="false"><path d="m5 12 4 4L19 6" /></svg></span><p><b>{strong}</b> {rest}</p></li>
        ))}
      </ul>
      <p className="cv-fine">Não é uma promessa de nota ou aprovação: é um material de estudo para você treinar com método.</p>
    </section>
  );
}
