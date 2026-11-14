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
      <span><b>Enem é domingo</b> · {left}<span className="hot-strip-cta"> · Garanta seu acesso</span></span>
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

/** Respostas diretas no topo: o que é, para quem, o que dá para fazer hoje, quanto custa e como recebe. */
export function HeroAnswers({ essencial, premium }: { essencial: string; premium: string }) {
  const rows = [
    ["Hoje", "Abra “Minha revisão”, estude uma revisão, resolva um treino e refaça seus erros."],
    ["Valor", `Premium ${premium} ou Essencial ${essencial}, já com a taxa do checkout.`],
    ["Acesso", "Pela plataforma, com o e-mail da compra. Leitura online."],
  ];
  return (
    <dl className="hero-answers">
      {rows.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
    </dl>
  );
}

/** Caminho curto e real dentro da plataforma (cada tela existe na área do aluno). */
export function TodayPath() {
  const steps = [
    ["Minha revisão", "Veja o que fazer hoje. Cada tarefa mostra a duração estimada."],
    ["Questões", "Filtre por dificuldade e resolva com a resolução comentada."],
    ["Treinos", "Faça um treino de 20 questões, com correção ao final."],
    ["Meus erros", "Refaça as que errou, com o motivo do erro mais comum."],
  ];
  return (
    <section className="cv-section cv-path container" id="comecar" aria-labelledby="cv-path-title">
      <div className="cv-head">
        <span className="landing-eyebrow">Por onde começar</span>
        <h2 id="cv-path-title">Seu caminho para hoje, em 4 passos</h2>
        <p>Você não precisa passar por todo o material. Use este caminho e deixe o resto como apoio.</p>
      </div>
      <ol className="cv-steps">
        {steps.map(([title, text], index) => (
          <li key={title}><span aria-hidden="true">{index + 1}</span><b>{title}</b><p>{text}</p></li>
        ))}
      </ol>
    </section>
  );
}

type CompareRow = { label: string; essencial?: React.ReactNode; premium?: React.ReactNode; both?: React.ReactNode };

/** Comparação curta e fiel ao catálogo, com os mesmos critérios para os dois planos. */
export function PlanCompare({ facts, essencialTotal, premiumTotal, essencialBase, premiumBase, fee, essencialBooks, premiumBooks }: { facts: Facts; essencialTotal: string; premiumTotal: string; essencialBase: string; premiumBase: string; fee: string; essencialBooks: string[]; premiumBooks: number }) {
  const yes = <span className="cmp-yes" aria-label="Incluído">✓ Incluído</span>;
  const no = <span className="cmp-no" aria-label="Não incluído">—</span>;
  const rows: CompareRow[] = [
    { label: "Operação 2º Domingo (Matemática e Natureza)", essencial: <>{yes}<small>{facts.questions} questões comentadas, {facts.simulados} simulados de {facts.simuladoQuestions}, {facts.treinos} treinos, {facts.modules} revisões</small></>, premium: <>{yes}<small>Igual ao Essencial</small></> },
    { label: "Minha revisão e caderno de erros", both: yes },
    { label: "E-books", essencial: <><b>{essencialBooks.length}</b><small>{essencialBooks.join(", ")}</small></>, premium: <><b>{premiumBooks}</b><small>Inclui Física, Química e Redação</small></> },
    { label: "Banco geral (332 questões distintas, 60 listas, 30 simulados)", essencial: <><span className="cmp-part">Parcial</span><small>Exercícios do plano, sem os 30 simulados</small></>, premium: yes },
    { label: "Biblioteca histórica (1.800 questões de referência, com links para fontes oficiais)", essencial: no, premium: yes },
    { label: "Fichas e checklists da reta final", essencial: no, premium: yes },
    { label: "Leitura", both: <small>Online, no leitor da plataforma. Sem download.</small> },
    { label: "Acesso", both: <small>Pagamento único, sem mensalidade e sem data de expiração.</small> },
    { label: "Valor", essencial: <><b>{essencialTotal}</b><small>{essencialBase} + {fee} de taxa</small></>, premium: <><b>{premiumTotal}</b><small>{premiumBase} + {fee} de taxa</small></> },
  ];
  return (
    <section className="cv-section cv-compare container" id="comparar" aria-labelledby="cv-compare-title">
      <div className="cv-head">
        <span className="landing-eyebrow">Compare</span>
        <h2 id="cv-compare-title">Essencial ou Premium?</h2>
        <p>Os dois incluem a Operação 2º Domingo inteira. O Premium amplia o repertório: os e-books de Física e Química e o banco geral.</p>
      </div>
      <div className="cmp-wrap" role="region" aria-label="Comparação entre os planos" tabIndex={0}>
        <table className="cmp">
          <thead><tr><th scope="col"><span className="sr-only">Item</span></th><th scope="col">Essencial</th><th scope="col" className="is-premium">Premium <em>recomendado</em></th></tr></thead>
          <tbody>
            {rows.map((row) => (<tr key={row.label}><th scope="row">{row.label}</th>{row.both ? <td colSpan={2} data-label="Os dois planos">{row.both}</td> : <><td data-label="Essencial">{row.essencial}</td><td className="is-premium" data-label="Premium">{row.premium}</td></>}</tr>))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Como a compra vira acesso, perto dos botões de compra. */
export function DeliveryNote() {
  const items = [
    "Pagamento por Pix ou cartão no checkout seguro da Cakto.",
    "O plano é liberado quando a Cakto confirma o pagamento.",
    "Entre com o mesmo e-mail da compra. No primeiro acesso, crie sua senha em “Primeiro acesso”.",
    "Leitura online dentro da plataforma, sem download, e precisa de internet.",
    "Pagou e o acesso não apareceu? Fale com o atendimento, com o e-mail da compra.",
  ];
  return (
    <div className="delivery" aria-label="Como você recebe o acesso">
      <b>Como você recebe</b>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </div>
  );
}
