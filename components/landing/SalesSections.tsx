import Link from "next/link";
import type { ReactNode } from "react";
import type { CampaignView } from "../../lib/campaign";
import type { campaignFacts } from "../../lib/operacao/campaign-facts";
import type { inventory } from "../../lib/inventory";
import { ebookMaterials } from "../../lib/ebook-catalog";
import { brl, SERVICE_FEE_CENTS } from "../../lib/pricing";
import type { DemoQuestion } from "./explorer-types";
import TryQuestion from "./TryQuestion";
import GuardianShare from "./GuardianShare";

type Facts = ReturnType<typeof campaignFacts>;
type Inv = ReturnType<typeof inventory>;
type PlanLite = { id: string; name: string; cents: number };

const cover = (slug: string) => ebookMaterials.find((book) => book.id.split("-").slice(2).join("-") === slug)!;
const Cover = ({ slug, priority = false, premium = false, className = "" }: { slug: string; priority?: boolean; premium?: boolean; className?: string }) => {
  const book = cover(slug);
  return (
    <span className={`s-cover ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={book.cover.replace("-640.webp", "-320.webp")} width={320} height={480} alt={`Capa do e-book ${book.title}`} loading={priority ? "eager" : "lazy"} decoding="async" {...(priority ? { fetchPriority: "high" as const } : {})} />
      {premium ? <i>Premium</i> : null}
    </span>
  );
};

/** Faixa de data: só aparece enquanto a campanha estiver ativa e sempre calculada pela data (horário de Brasília). */
export function SalesStrip({ view }: { view: CampaignView }) {
  if (!view.active) return null;
  // Só com prova confirmada e futura: o texto vem do modelo de edição (data oficial e fonte), nunca de uma edição anterior.
  return <p className="s-strip"><b>{view.label}</b>{view.countdown ? <span> · {view.countdown}</span> : null}</p>;
}

export function SalesHero({ hasAccess, studyArea, essencialTotal, question, view }: { hasAccess: boolean; studyArea: string; essencialTotal: string; question?: DemoQuestion; view: CampaignView }) {
  return (
    <section className="s-hero" id="topo" aria-labelledby="s-title">
      <div className={`s-wrap ${question ? "s-hero-grid" : "s-center"}`}>
        <div className="s-hero-copy">
          <span className="s-pill">Desbloqueia ENEM 2027</span>
          <h1 id="s-title">Sua preparação para o ENEM 2027, <em>passo a passo.</em></h1>
          <p className="s-lead">Siga uma trilha, pratique questões e volte aos assuntos que mais precisam de atenção. Resolução passo a passo, caderno de erros e revisão, direto no celular.</p>
          <div className="s-actions">
            {hasAccess
              ? <Link className="s-btn s-btn-lg" href={studyArea}>CONTINUAR ESTUDANDO</Link>
              : <a className="s-btn s-btn-lg" href="#ofertas">CONHECER OS PLANOS</a>}
            <a className="s-link" href="#experimentar">Experimentar uma questão</a>
          </div>
          <ul className="s-ticks" aria-label="Condições">
            <li>Pagamento único, sem mensalidade</li>
            <li>Pix ou cartão</li>
            <li>7 dias de garantia</li>
          </ul>
          <p className="s-trust">Planos a partir de <b>{essencialTotal}</b> no total, pela Cakto.</p>
          <p className="s-cal" role="status"><b>{view.label}.</b> {view.calendarConfirmed ? view.detail : "Enquanto não há data oficial, o plano de estudos segue por semanas."}</p>
        </div>
        {question ? <TryQuestion  question={question} /> : null}
      </div>
      <div className="s-wrap s-center">
        <figure className="s-stage">
          <div className="s-fan">
            <Cover slug="fisica" className="f1" premium />
            <Cover slug="biologia" className="f2" />
            <Cover slug="matematica" className="f3" priority />
            <Cover slug="quimica" className="f4" premium />
          </div>
          <figcaption>E-books da GoDev. Matemática e Biologia estão no Essencial; Física e Química, no Premium.</figcaption>
        </figure>
      </div>
    </section>
  );
}

/** Amostras reais: páginas dos e-books e uma questão com resolução comentada. */
export function SalesSamples({ question }: { question: DemoQuestion | undefined }) {
  return (
    <section className="s-section s-band" id="amostra" aria-labelledby="s-amostra-title">
      <div className="s-wrap">
        <header className="s-head">
          <span className="s-eyebrow">Por dentro do material</span>
          <h2 id="s-amostra-title">Veja o que você vai estudar</h2>
          <p>Páginas reais dos e-books e uma questão com a resolução comentada, exatamente como aparecem na plataforma.</p>
        </header>

        <article className="s-feature">
          <div className="s-feature-media s-book" aria-label="Duas páginas do e-book de Matemática">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/amostras/mat-p07.webp" width={560} height={840} loading="lazy" decoding="async" alt="Página de conceitos do e-book de Matemática: Porcentagens e variações" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/amostras/mat-p08.webp" width={560} height={840} loading="lazy" decoding="async" alt="Página de aprofundamento do e-book de Matemática, com a explicação do exemplo" />
          </div>
          <div className="s-feature-copy">
            <span className="s-tag s-tag-ok">Essencial e Premium</span>
            <h3>Conceito primeiro, exemplo resolvido depois</h3>
            <p>Cada unidade do e-book tem uma página de conceitos e outra de aprofundamento. Aqui, a Unidade 03 de Matemática: porcentagens e variações.</p>
            <ul className="s-checks"><li>34 páginas e 15 unidades por e-book</li><li>Exemplo de aplicação em cada unidade</li><li>Leitura online, no celular ou no computador</li></ul>
          </div>
        </article>

        {question ? (
          <article className="s-feature s-feature-flip">
            <div className="s-feature-media">
              <div className="s-qcard" role="group" aria-label="Exemplo de questão com resolução comentada">
                <p className="s-qmeta">{question.discLabel} · {question.topic}</p>
                <div className="s-qstmt" dangerouslySetInnerHTML={{ __html: question.statementHtml }} />
                <ol className="s-qopts">
                  {question.options.map((option) => (
                    <li key={option.id} className={option.id === question.answer ? "is-right" : undefined}>
                      <b>{option.id}</b>
                      <span dangerouslySetInnerHTML={{ __html: option.html }} />
                    </li>
                  ))}
                </ol>
                <div className="s-qsol">
                  <strong>Resolução comentada · alternativa {question.answer}</strong>
                  <div dangerouslySetInnerHTML={{ __html: question.resolutionHtml }} />
                  <p className="s-qmis"><b>Erro comum:</b> {question.misconception}</p>
                </div>
              </div>
            </div>
            <div className="s-feature-copy">
              <span className="s-tag s-tag-ok">Essencial e Premium</span>
              <h3>Entenda o raciocínio, não só o gabarito</h3>
              <p>As questões da Matemática e Natureza trazem a resolução passo a passo e o motivo do erro mais comum. As que você erra vão para o seu caderno de erros.</p>
            </div>
          </article>
        ) : null}

        <article className="s-feature">
          <div className="s-feature-media s-book s-book-one" aria-label="Página do e-book de Física">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/amostras/fis-p05.webp" width={560} height={840} loading="lazy" decoding="async" alt="Página de conceitos do e-book de Física: Cinemática" />
          </div>
          <div className="s-feature-copy">
            <span className="s-tag s-tag-premium">Só no Premium</span>
            <h3>E-books de Física e Química</h3>
            <p>O Premium reúne os 16 e-books, incluindo Física, Química e Redação. Ao lado, a Unidade 02 de Física: cinemática.</p>
            <p className="s-note">O Essencial tem 4 e-books: Língua Portuguesa, História, Biologia e Matemática.</p>
          </div>
        </article>
      </div>
    </section>
  );
}

const benefitIcons: Record<string, ReactNode> = {
  rev: <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16ZM8 8h8M8 12h6" />,
  q: <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />,
  t: <path d="M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM9 1h6" />,
  e: <path d="M3 7l9-4 9 4v10l-9 4-9-4V7Zm9 4v10M3 7l9 4 9-4" />,
  c: <path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm4 15h.01" />,
  p: <path d="M4 6h16M4 12h16M4 18h10M18 16l2 2 3-4" />,
  b: <path d="M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-3" />,
  h: <path d="M12 3v3m6.4 1.6-2.1 2.1M21 12h-3M5.6 7.6l2.1 2.1M3 12h3m3 9h6M10 17h4a4 4 0 1 0-4 0Z" />,
};

/** Faixa de números: tudo calculado do acervo publicado, nunca digitado à mão. */
export function SalesNumbers({ facts, inv, ebooks }: { facts: Facts; inv: Inv; ebooks: number }) {
  const items: [string, string][] = [
    [String(facts.questions), "questões comentadas na Matemática e Natureza"],
    [String(facts.modules), "revisões rápidas de 25 a 30 minutos"],
    [`${facts.simulados + facts.treinos}`, `treinos e simulados de ${facts.treinoQuestions} a ${facts.simuladoQuestions} questões`],
    [String(ebooks), "e-books para ler online (4 no Essencial)"],
    [String(inv.generalDistinct), "questões distintas no banco geral do Premium"],
  ];
  return (
    <section className="s-numbers" aria-label="A GoDev em números">
      <ul className="s-wrap">
        {items.map(([value, label]) => (<li key={label}><b>{value}</b><span>{label}</span></li>))}
      </ul>
    </section>
  );
}

type Tool = { key: keyof typeof benefitIcons; title: string; text: string; plan: "all" | "premium" };

/** Ciclo de estudo e mapa do que existe dentro da plataforma, com a marca de qual plano libera cada recurso. */
export function SalesTools({ facts, inv }: { facts: Facts; inv: Inv }) {
  const loop = [
    ["Revise", "Uma revisão rápida do conceito, com exemplo resolvido."],
    ["Pratique", "Questões e treinos curtos, com cronômetro se você quiser."],
    ["Entenda", "Resolução passo a passo e o motivo do erro mais comum."],
    ["Refaça", "O que você errou vai para o caderno de erros até virar acerto."],
  ];
  const tools: Tool[] = [
    { key: "rev", title: `${facts.modules} revisões rápidas`, text: `Conceito, exemplo resolvido e ${facts.formulas} fichas de fórmulas para consultar.`, plan: "all" },
    { key: "q", title: `${facts.questions} questões comentadas`, text: "Filtre por disciplina e tópico, favorite e marque para revisar depois.", plan: "all" },
    { key: "t", title: `${facts.treinos} treinos e ${facts.simulados} simulados`, text: `Treinos de ${facts.treinoQuestions} questões e simulados de ${facts.simuladoQuestions}, com mapa de questões, cronômetro e correção comentada.`, plan: "all" },
    { key: "e", title: "Caderno de erros", text: "Monta-se sozinho com o que você errou ou marcou. Releia a resolução e tente de novo.", plan: "all" },
    { key: "p", title: "Minha revisão", text: "Plano dos dias que faltam, com meta diária e sequência de estudo.", plan: "all" },
    { key: "c", title: "Leitor de e-books", text: "Leia no celular, tablet ou computador e retome de onde parou.", plan: "all" },
    { key: "b", title: `Banco geral: ${inv.generalDistinct} questões`, text: `${inv.lists} listas e ${inv.simulados} simulados para ir além da Operação.`, plan: "premium" },
    { key: "h", title: "Biblioteca histórica", text: "1.800 referências de questões com links para as fontes oficiais.", plan: "premium" },
  ];
  return (
    <section className="s-section" id="beneficios" aria-labelledby="s-ben-title">
      <div className="s-wrap">
        <header className="s-head">
          <span className="s-eyebrow">O que tem lá dentro</span>
          <h2 id="s-ben-title">Um ciclo simples: revise, pratique, entenda, refaça</h2>
          <p>Você não precisa passar por todo o material. Comece por “Minha revisão”, escolha uma revisão, resolva um treino e refaça seus erros.</p>
        </header>
        <ol className="s-loop">
          {loop.map(([title, text], index) => (<li key={title}><span aria-hidden="true">{index + 1}</span><b>{title}</b><p>{text}</p></li>))}
        </ol>
        <ul className="s-tools">
          {tools.map((tool) => (
            <li key={tool.title} className={tool.plan === "premium" ? "is-premium" : undefined}>
              <span className="s-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false">{benefitIcons[tool.key]}</svg></span>
              <span className={`s-tag ${tool.plan === "premium" ? "s-tag-premium" : "s-tag-ok"}`}>{tool.plan === "premium" ? "Só no Premium" : "Essencial e Premium"}</span>
              <h3>{tool.title}</h3>
              <p>{tool.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

type OfferProps = { plans: PlanLite[]; facts: Facts; inv: Inv; checkoutReady: boolean };

export function SalesOffers({ plans, facts, inv, checkoutReady }: OfferProps) {
  const base = (id: string) => plans.find((plan) => plan.id === id)?.cents ?? 0;
  const total = (id: string) => base(id) + SERVICE_FEE_CENTS;
  const essentialBooks = ebookMaterials.filter((book) => book.plan === "essencial").map((book) => book.title);
  const buy = (id: "essencial" | "premium", name: string) => checkoutReady
    ? <a className="s-btn s-btn-block" href={`/api/checkout/${id}`} data-analytics-event={`offer_${id}`}>{`Quero o ${name}`}</a>
    : <Link className="s-btn s-btn-block" href="/suporte">Falar com o atendimento</Link>;
  return (
    <section className="s-section s-offers" id="ofertas" aria-labelledby="s-ofertas-title"><span id="planos" aria-hidden="true" />
      <div className="s-wrap">
        <header className="s-head">
          <span className="s-eyebrow">Planos</span>
          <h2 id="s-ofertas-title">Escolha o plano ideal para sua revisão</h2>
          <p>Os dois incluem toda a área de Matemática e Natureza. O Premium amplia o repertório. Os preços abaixo já são o total cobrado no checkout.</p>
        </header>
        <div className="s-plans">
          <article className="s-plan" aria-labelledby="plan-essencial">
            <div className="s-plan-media"><div className="s-stack"><Cover slug="matematica" /><Cover slug="biologia" /><Cover slug="historia" /><Cover slug="lingua-portuguesa" /></div></div>
            <h3 id="plan-essencial">Essencial</h3>
            <p className="s-plan-for">Para revisar Matemática e Natureza com a Matemática e Natureza.</p>
            <ul className="s-checks">
              <li><b>Matemática e Natureza:</b> {facts.questions} questões comentadas, {facts.simulados} simulados de {facts.simuladoQuestions} questões e {facts.treinos} treinos</li>
              <li>{facts.modules} revisões rápidas e {facts.formulas} fichas de fórmulas</li>
              <li>Minha revisão e caderno de erros</li>
              <li><b>4 e-books:</b> {essentialBooks.join(", ")}</li>
            </ul>
            <div className="s-price"><b>{brl(total("essencial"))}</b><span>no total · pagamento único</span><small>{brl(base("essencial"))} + {brl(SERVICE_FEE_CENTS)} de taxa do checkout</small></div>
            {buy("essencial", "Essencial")}
            <GuardianShare plan="essencial" name="Essencial" total={brl(total("essencial"))} />
            <p className="s-plan-foot">Acesso pela plataforma · 7 dias de garantia</p>
          </article>

          <article className="s-plan s-plan-premium" aria-labelledby="plan-premium">
            <span className="s-badge">Mais completo</span>
            <div className="s-plan-media"><div className="s-stack"><Cover slug="fisica" /><Cover slug="quimica" /><Cover slug="redacao" /><Cover slug="matematica" /><i className="s-more">+12 e-books</i></div></div>
            <h3 id="plan-premium">Premium</h3>
            <p className="s-plan-for">Para ir além da Operação, com Física, Química e o banco geral.</p>
            <ul className="s-checks">
              <li><b>Tudo do Essencial</b>, incluindo a Matemática e Natureza</li>
              <li><b>16 e-books</b>, incluindo Física, Química e Redação</li>
              <li><b>Banco geral:</b> {inv.generalDistinct} questões distintas em {inv.lists} listas e {inv.simulados} simulados (as questões se repetem entre coleções)</li>
              <li><b>Biblioteca histórica:</b> 1.800 referências de questões, com links para fontes oficiais (é um índice, não são resoluções autorais)</li>
              <li>Fichas e checklists de revisão</li>
            </ul>
            <div className="s-price"><b>{brl(total("premium"))}</b><span>no total · pagamento único</span><small>{brl(base("premium"))} + {brl(SERVICE_FEE_CENTS)} de taxa do checkout</small></div>
            {buy("premium", "Premium")}
            <GuardianShare plan="premium" name="Premium" total={brl(total("premium"))} />
            <p className="s-plan-foot">Acesso pela plataforma · 7 dias de garantia</p>
          </article>
        </div>

        <details className="s-compare">
          <summary>Ver a comparação completa entre os planos</summary>
          <div className="s-compare-body">
            <table>
              <thead><tr><th scope="col"><span className="sr-only">Item</span></th><th scope="col">Essencial</th><th scope="col">Premium</th></tr></thead>
              <tbody>
                <tr><th scope="row">Matemática e Natureza</th><td data-l="Essencial">Incluída</td><td data-l="Premium">Incluída (igual)</td></tr>
                <tr><th scope="row">Minha revisão e caderno de erros</th><td data-l="Essencial">Incluídos</td><td data-l="Premium">Incluídos</td></tr>
                <tr><th scope="row">E-books</th><td data-l="Essencial">4: {essentialBooks.join(", ")}</td><td data-l="Premium">16, incluindo Física, Química e Redação</td></tr>
                <tr><th scope="row">Banco geral ({inv.generalDistinct} questões distintas, {inv.lists} listas, {inv.simulados} simulados)</th><td data-l="Essencial">Exercícios do plano, sem os {inv.simulados} simulados</td><td data-l="Premium">Completo</td></tr>
                <tr><th scope="row">Biblioteca histórica (1.800 referências com links)</th><td data-l="Essencial">Não incluída</td><td data-l="Premium">Incluída</td></tr>
                <tr><th scope="row">Fichas e checklists de revisão</th><td data-l="Essencial">Não incluídos</td><td data-l="Premium">Incluídos</td></tr>
                <tr><th scope="row">Leitura</th><td data-l="Essencial">Online, sem download</td><td data-l="Premium">Online, sem download</td></tr>
                <tr><th scope="row">Acesso</th><td data-l="Essencial">Pagamento único, sem data de expiração</td><td data-l="Premium">Pagamento único, sem data de expiração</td></tr>
                <tr><th scope="row">Valor total</th><td data-l="Essencial"><b>{brl(total("essencial"))}</b> ({brl(base("essencial"))} + {brl(SERVICE_FEE_CENTS)})</td><td data-l="Premium"><b>{brl(total("premium"))}</b> ({brl(base("premium"))} + {brl(SERVICE_FEE_CENTS)})</td></tr>
              </tbody>
            </table>
            <p className="s-note"><b>Questões distintas</b> são as que têm enunciado, alternativas e gabarito diferentes. Em coleções diferentes, a mesma questão pode reaparecer, por isso as quantidades não se somam. As <b>referências</b> da biblioteca apontam para fontes externas. Os <b>simulados da Operação</b> ({facts.simulados} de {facts.simuladoQuestions} questões) são os mesmos nos dois planos; os {inv.simulados} simulados do banco geral são do Premium.</p>
          </div>
        </details>
      </div>
    </section>
  );
}

export function SalesAccess() {
  const steps = [
    ["Escolha o plano", "Essencial ou Premium, o que combinar com a sua revisão."],
    ["Pague na Cakto", "Pix ou cartão, no checkout seguro. O total é o mesmo da tela de pagamento."],
    ["Entre com o e-mail da compra", "No primeiro acesso, crie sua senha em “Primeiro acesso”."],
  ];
  return (
    <section className="s-section s-band" id="acesso" aria-labelledby="s-acesso-title">
      <div className="s-wrap">
        <header className="s-head">
          <span className="s-eyebrow">Acesso e garantia</span>
          <h2 id="s-acesso-title">Como você recebe</h2>
        </header>
        <ol className="s-steps">
          {steps.map(([title, text], index) => (<li key={title}><span aria-hidden="true">{index + 1}</span><b>{title}</b><p>{text}</p></li>))}
        </ol>
        <div className="s-info">
          <div>
            <h3>Condições de acesso</h3>
            <ul className="s-checks">
              <li>O plano é liberado quando a Cakto confirma o pagamento.</li>
              <li>Acesso sem data de expiração, em pagamento único.</li>
              <li>Leitura online dentro da plataforma, sem download. É preciso estar conectado à internet.</li>
              <li>Pagou e o acesso não apareceu? Fale com o <Link href="/suporte">atendimento</Link>, sem precisar entrar.</li>
            </ul>
          </div>
          <div>
            <h3>Garantia de 7 dias</h3>
            <p>Você tem sete dias após a compra para pedir reembolso, pelo atendimento ou pelo comprovante da Cakto. <Link href="/politicas/reembolso">Ler a política de reembolso</Link>.</p>
            <h3>Como o material é feito</h3>
            <p>Textos e exemplos elaborados pela GoDev Education para esta coleção, com a matriz de referência do Inep como orientação curricular. As fontes ficam listadas no fim de cada e-book. É material independente: não é publicação oficial do Inep nem prevê os assuntos da prova.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SalesFaq({ inv, essencialTotal, premiumTotal, essencialBase, premiumBase }: { inv: Inv; essencialTotal: string; premiumTotal: string; essencialBase: string; premiumBase: string }) {
  const faq: [string, ReactNode][] = [
    ["Qual a diferença entre o Essencial e o Premium?", <>Os dois incluem toda a área de Matemática e Natureza. O Essencial traz 4 e-books; o Premium traz os 16, incluindo Física, Química e Redação, além do banco geral ({inv.generalDistinct} questões distintas em {inv.lists} listas e {inv.simulados} simulados, que se repetem entre coleções), da biblioteca histórica (1.800 referências com links, um índice) e das fichas e checklists.</>],
    ["Quanto vou pagar no total?", <>Essencial: {essencialBase} + R$ 0,99 de taxa do checkout = <b>{essencialTotal}</b>. Premium: {premiumBase} + R$ 0,99 = <b>{premiumTotal}</b>. Pagamento único, sem mensalidade. É o valor que aparece na tela de pagamento.</>],
    ["Meu responsável pode pagar por mim?", "Pode. Em cada plano, toque em “Enviar para meu responsável pagar”: o link da oferta vai pelo WhatsApp ou pelo compartilhamento do celular. Quem paga usa Pix ou cartão no checkout da Cakto, e você entra com o e-mail informado na compra."],
    ["Preciso assinar ou renovar?", "Não. O pagamento é único, sem mensalidade e sem renovação automática. O acesso não tem data de expiração."],
    ["Como o caderno de erros funciona?", "Cada questão que você erra entra sozinha no caderno, junto com as que você marcar para revisar depois. Você relê a resolução, volta ao módulo e tenta de novo."],
    ["Posso estudar pelo celular?", "Sim. A plataforma funciona no celular, no tablet e no computador, e o leitor retoma de onde você parou."],
    ["Posso baixar os e-books?", "Não. A leitura é online, no leitor protegido da plataforma, e é preciso estar conectado à internet."],
    ["Quando o acesso é liberado?", "Quando a Cakto confirma o pagamento. Entre com o e-mail usado na compra. Se já pagou e o acesso não apareceu, fale com o atendimento com o e-mail da compra e o comprovante."],
    ["Como crio minha senha?", "Na tela de entrada, use “Primeiro acesso” com o e-mail da compra. Se esquecer, use a recuperação de senha."],
    ["Como funciona a garantia?", "São sete dias após a compra para pedir reembolso, pelo atendimento ou pelo comprovante da Cakto. Veja a política de reembolso para o passo a passo."],
    ["Como falo com o atendimento sem entrar na plataforma?", <>Pela página <Link href="/suporte">Atendimento</Link>, que mostra os contatos oficiais. Informe o e-mail da compra e nunca envie senha ou dados do cartão.</>],
  ];
  return (
    <section className="s-section" id="duvidas" aria-labelledby="s-faq-title">
      <div className="s-wrap s-narrow">
        <header className="s-head"><span className="s-eyebrow">Dúvidas</span><h2 id="s-faq-title">Perguntas frequentes</h2></header>
        <div className="s-faq">
          {faq.map(([q, a]) => (<details key={q}><summary>{q}</summary><div>{typeof a === "string" ? <p>{a}</p> : <p>{a}</p>}</div></details>))}
        </div>
      </div>
    </section>
  );
}

export function SalesFinal({ message }: { message: string }) {
  return (
    <section className="s-final" aria-labelledby="s-final-title">
      <div className="s-wrap s-center">
        <h2 id="s-final-title">{message}</h2>
        <p>Escolha o plano e comece pela primeira questão.</p>
        <a className="s-btn s-btn-lg" href="#ofertas">QUERO ESCOLHER MEU PLANO</a>
      </div>
    </section>
  );
}

/** Prévia da Trilha com unidades reais do catálogo. Os estados são um EXEMPLO ilustrativo (nenhum dado de aluno). */
export function SalesTrilha({ units }: { units: { id: string; title: string; minutes: number }[] }) {
  const demo = [
    { state: "Concluída", cls: "is-done", note: "fundamento, prática e desafio feitos" },
    { state: "Em andamento", cls: "is-now", note: "próxima etapa: desafio ENEM" },
    { state: "Bloqueada", cls: "is-lock", note: "abre quando você concluir as anteriores (ou validar no teste de avanço)" },
  ];
  const shown = units.slice(0, 3);
  return (
    <section className="s-section s-band" id="trilha" aria-labelledby="s-trilha-title">
      <div className="s-wrap">
        <header className="s-head">
          <span className="s-eyebrow">Trilha ENEM</span>
          <h2 id="s-trilha-title">Você sempre sabe onde está e o que abre a próxima etapa</h2>
          <p>Cada unidade tem fundamento, prática guiada, desafio no formato do Enem e revisão agendada. Já conhece o tema? O teste de avanço valida a unidade.</p>
        </header>
        <ol className="s-trail" aria-label="Exemplo ilustrativo da trilha">
          {shown.map((u, i) => (
            <li key={u.id} className={demo[i].cls}>
              <span className="s-trail-dot" aria-hidden="true">{i + 1}</span>
              <div><b>{u.title}</b><small>{demo[i].state} · {demo[i].note}</small></div>
            </li>
          ))}
        </ol>
        <p className="s-note s-center">Exemplo ilustrativo com unidades reais do catálogo. Hoje a trilha cobre Matemática e Natureza; Humanas, Linguagens e Redação entram quando houver atividades aprovadas.</p>
      </div>
    </section>
  );
}
