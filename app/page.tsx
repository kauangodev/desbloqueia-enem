"use client";

import { useEffect, useMemo, useState } from "react";
import { examDates, product } from "../lib/config";

const includes = [
  ["01", "Resumos por disciplina", "Materiais objetivos para revisar os pontos mais importantes com menos dispersão.", "▤"],
  ["02", "Exercícios comentados", "Questões acompanhadas de explicações para transformar prática em aprendizado.", "✎"],
  ["03", "Simulados", "Uma estrutura de prática para você se familiarizar com o formato das provas.", "◒"],
  ["04", "Cronograma de estudos", "Uma visão clara para distribuir suas sessões até os dias do exame.", "◷"],
];

const faqs = [
  ["O material é digital?", "Sim. O kit foi planejado para consulta no celular, tablet ou computador. A forma exata de acesso será definida no checkout configurado."],
  ["Posso estudar pelo celular?", "Sim. A página e os materiais são pensados para uma rotina de estudo mobile-first."],
  ["Como recebo o kit após a compra?", "A entrega depende da plataforma de pagamento e do checkout configurados pelo administrador. Enquanto isso não estiver definido, as vendas permanecem desativadas."],
  ["O kit substitui um curso completo?", "Não. Ele é uma ferramenta de revisão e organização, não substitui um curso completo nem acompanhamento individual."],
  ["Até quando os materiais são úteis?", "A proposta é apoiar a reta final de 2026, com foco nas provas de 8 e 15 de novembro."],
  ["Como funciona o reembolso?", "As condições precisam ser publicadas junto do checkout real, respeitando as regras aplicáveis às compras online."],
];

function daysUntil(date: Date) {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 86400000));
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [consent, setConsent] = useState(false);
  const [days, setDays] = useState(() => daysUntil(examDates[0]));
  const checkoutReady = Boolean(product.checkoutUrl);

  useEffect(() => { setDays(daysUntil(examDates[0])); }, []);
  const status = useMemo(() => days > 0 ? `${days} dias até a primeira prova` : "A primeira prova já aconteceu", [days]);

  function trackCta() {
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("desbloqueia:cta", { detail: { consent } }));
  }

  return <main>
    <header className="topbar"><a className="brand" href="#inicio"><span className="brandMark">D</span> desbloqueia<span>enem</span></a><a className="toplink" href="#inclui">Ver o que inclui <span>↘</span></a></header>
    <section className="hero shell" id="inicio">
      <div className="heroCopy"><p className="eyebrow">REVISÃO PARA O ENEM 2026 <i /></p><h1>Chegou a hora de organizar sua <em>reta final.</em></h1><p className="lede">Resumos objetivos, exercícios comentados, simulados e um cronograma prático para aproveitar melhor seu tempo de estudo.</p><div className="actions"><a className="button primary" href="#oferta" onClick={trackCta}>QUERO MEU KIT DE REVISÃO <span>→</span></a><small>Material digital · Estude no celular, tablet ou computador</small></div></div>
      <div className="heroVisual" aria-label="Representação ilustrativa do kit digital"><div className="paper back"><small>CRONOGRAMA</small><strong>Reta final<br />ENEM 2026</strong><span>08 · 15 NOV</span></div><div className="paper front"><span className="stamp">KIT 01</span><small>RESUMO EXPRESS</small><strong>Revisão que<br /><b>destrava.</b></strong><div className="lines"><i /><i /><i /></div><span className="badge">ILUSTRATIVO</span></div><div className="glow" /></div>
    </section>
    <div className="notice shell"><span>✦</span><b>{status}</b><span>·</span><span>8 e 15 de novembro de 2026</span></div>
    <section className="value shell"><div className="sectionIntro"><p className="kicker">MENOS RUÍDO. MAIS DIREÇÃO.</p><h2>Uma revisão mais organizada começa por um <em>plano claro.</em></h2><p>O kit reúne ferramentas complementares para você organizar as revisões e praticar com mais objetividade — sem promessas mágicas, sem conteúdo inventado.</p></div><div className="valueGrid"><article><span>01</span><h3>Organização</h3><p>Encontre o próximo passo e use seu tempo com mais intenção.</p></article><article><span>02</span><h3>Prática</h3><p>Transforme a revisão em ação com exercícios e simulados.</p></article><article><span>03</span><h3>Clareza</h3><p>Tenha uma visão simples do que revisar e quando revisar.</p></article></div></section>
    <section className="includes shell" id="inclui"><div className="sectionHead"><div><p className="kicker">DENTRO DO KIT</p><h2>Quatro peças para<br /><em>destravar a revisão.</em></h2></div><p>Os detalhes finais, quantidades e arquivos serão atualizados conforme o conteúdo for concluído.</p></div><div className="includeGrid">{includes.map(([num,title,desc,icon]) => <article className="includeCard" key={title}><div className="cardTop"><span>{num}</span><b>{icon}</b></div><h3>{title}</h3><p>{desc}</p><div className="miniPreview"><i /><i /><i /></div></article>)}</div></section>
    <section className="how shell"><div className="howPanel"><p className="kicker">COMO FUNCIONA</p><h2>Do primeiro acesso à sua próxima sessão.</h2><ol><li><b>Adquira seu kit.</b><span>Quando o checkout estiver configurado, o botão levará você à compra real.</span></li><li><b>Receba o acesso.</b><span>A entrega seguirá o funcionamento da plataforma escolhida.</span></li><li><b>Organize e pratique.</b><span>Use o cronograma, os exercícios e os simulados no seu ritmo.</span></li></ol></div><div className="calendar"><p className="kicker">MAPA DE REVISÃO</p><div className="calendarHead"><b>NOVEMBRO 2026</b><span>08 · 15</span></div><div className="week">{["SEG","TER","QUA","QUI","SEX","SÁB","DOM"].map(x=><span key={x}>{x}</span>)}</div><div className="days">{Array.from({length: 30}, (_,i)=><span className={i===7||i===14?"exam":""} key={i}>{i+1}</span>)}</div><small>Visual demonstrativo · personalize após a conclusão dos materiais.</small></div></section>
    <section className="offer shell" id="oferta"><div className="offerCopy"><p className="kicker">A OFERTA</p><h2>Uma reta final com menos improviso.</h2><p>O Kit Reta Final ENEM 2026 é um material educacional independente para apoiar sua organização e prática.</p><div className="trust"><span>✓</span> Sem promessa de nota ou aprovação<br /><span>✓</span> Conteúdo digital e editável</div></div><div className="offerCard"><div><span className="label">KIT RETA FINAL</span><h3>Kit Reta Final<br />ENEM 2026</h3></div><div className="price"><small>preço sugerido</small><strong>{product.price}</strong><span>material digital</span></div><a className={`button ${checkoutReady ? "primary" : "disabled"}`} href={checkoutReady ? product.checkoutUrl : "#oferta"} onClick={trackCta}>{checkoutReady ? "GARANTIR MEU KIT" : "PRÉ-LANÇAMENTO"} <span>→</span></a><small className="fineprint">{checkoutReady ? "Você será direcionado ao checkout configurado." : "As vendas serão habilitadas quando o checkout, suporte e condições de reembolso forem configurados."}</small></div></section>
    <section className="faq shell"><div><p className="kicker">AINDA COM DÚVIDAS?</p><h2>Perguntas<br /><em>frequentes.</em></h2></div><div className="faqList">{faqs.map(([q,a],i)=><div className="faqItem" key={q}><button aria-expanded={openFaq===i} onClick={()=>setOpenFaq(openFaq===i?null:i)}><span>{q}</span><b>{openFaq===i?"−":"+"}</b></button>{openFaq===i&&<p>{a}</p>}</div>)}</div></section>
    <footer><div className="shell footerInner"><div><a className="brand" href="#inicio"><span className="brandMark">D</span> desbloqueia<span>enem</span></a><p>Material educacional independente.<br />Sem vínculo oficial com INEP ou MEC.</p></div><div><b>Suporte</b><p>{product.supportEmail}</p></div><div><b>Legal</b><p>Política de privacidade<br />Termos de uso · Reembolso</p></div></div><div className="shell copyright">© 2026 Desbloqueia Enem · Feito para uma revisão com mais clareza.</div></footer>
    {!consent&&<div className="consent"><p>Usamos apenas dados essenciais para o funcionamento. Rastreamento de marketing só será ativado após consentimento.</p><button onClick={()=>setConsent(true)}>Entendi</button></div>}
  </main>;
}
