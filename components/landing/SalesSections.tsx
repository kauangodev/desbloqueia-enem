import Link from "next/link";
import type { ReactNode } from "react";
import type { CampaignView } from "../../lib/campaign";
import type { campaignFacts } from "../../lib/operacao/campaign-facts";
import type { inventory } from "../../lib/inventory";
import { ebookMaterials } from "../../lib/ebook-catalog";
import { brl, SERVICE_FEE_CENTS } from "../../lib/pricing";
import type { DemoQuestion } from "./explorer-types";
import ThemeSwitch from "./ThemeSwitch";

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
  const left = view.daysLeft > 1 ? `Faltam ${view.daysLeft} dias` : view.daysLeft === 1 ? "Falta 1 dia" : "É hoje";
  return <p className="s-strip"><b>Enem 2026, 2º dia: domingo, 15/11</b><span> · {left}</span></p>;
}

export function SalesHero({ hasAccess, studyArea, essencialTotal }: { hasAccess: boolean; studyArea: string; essencialTotal: string }) {
  return (
    <section className="s-hero" id="topo" aria-labelledby="s-title">
      <div className="s-wrap s-center">
        <span className="s-pill">Material de estudo · Matemática e Natureza</span>
        <h1 id="s-title">Revise Matemática e Natureza com um caminho claro.</h1>
        <p className="s-lead">Revisões rápidas, questões com a resolução explicada e treinos curtos para o 2º dia do Enem. Estude pelo celular, no seu ritmo.</p>
        <div className="s-actions">
          {hasAccess
            ? <Link className="s-btn s-btn-lg" href={studyArea}>CONTINUAR MINHA REVISÃO</Link>
            : <a className="s-btn s-btn-lg" href="#ofertas">QUERO ESCOLHER MEU PLANO</a>}
          <a className="s-link" href="#amostra">Ver o material por dentro</a>
        </div>
        <p className="s-trust">Pagamento único na Cakto, com Pix ou cartão · 7 dias de garantia · planos a partir de <b>{essencialTotal}</b> no total</p>
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
              <p>As questões da Operação 2º Domingo trazem a resolução passo a passo e o motivo do erro mais comum. As que você erra vão para o seu caderno de erros.</p>
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
};

export function SalesBenefits({ facts }: { facts: Facts }) {
  const items = [
    ["rev", `${facts.modules} revisões rápidas`, "Revise um conceito antes de praticar.", `De 25 a 30 minutos cada, com exemplo resolvido e ${facts.formulas} fichas de fórmulas.`],
    ["q", `${facts.questions} questões comentadas`, "Entenda o raciocínio da resolução.", "Cada questão traz o passo a passo e o motivo do erro mais comum."],
    ["t", `${facts.treinos} treinos de ${facts.treinoQuestions} questões`, "Treine em sessões menores.", `E ${facts.simulados} simulados de ${facts.simuladoQuestions} questões, quando quiser o ritmo da prova.`],
    ["e", "Caderno de erros", "Volte às questões que você errou.", "O que errou fica guardado para refazer, com a explicação ao lado."],
    ["c", "Leitura online", "Estude pelo celular.", "Celular, tablet ou computador, sem instalar nada."],
  ] as const;
  return (
    <section className="s-section" id="beneficios" aria-labelledby="s-ben-title">
      <div className="s-wrap s-split">
        <header className="s-head s-head-left">
          <span className="s-eyebrow">Como ajuda</span>
          <h2 id="s-ben-title">Cada recurso tem um uso claro</h2>
          <p>Você não precisa passar por todo o material. Comece por “Minha revisão”, escolha uma revisão, resolva um treino e refaça seus erros. O resto fica como apoio.</p>
        </header>
        <ul className="s-benefits">
          {items.map(([key, title, use, detail]) => (
            <li key={key}>
              <span className="s-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false">{benefitIcons[key]}</svg></span>
              <div><b>{use}</b><p><strong>{title}.</strong> {detail}</p></div>
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
    <section className="s-section s-offers" id="ofertas" aria-labelledby="s-ofertas-title">
      <div className="s-wrap">
        <header className="s-head">
          <span className="s-eyebrow">Planos</span>
          <h2 id="s-ofertas-title">Escolha o plano ideal para sua revisão</h2>
          <p>Os dois incluem a Operação 2º Domingo inteira. O Premium amplia o repertório. Os preços abaixo já são o total cobrado no checkout.</p>
        </header>
        <div className="s-plans">
          <article className="s-plan" aria-labelledby="plan-essencial">
            <div className="s-plan-media"><div className="s-stack"><Cover slug="matematica" /><Cover slug="biologia" /><Cover slug="historia" /><Cover slug="lingua-portuguesa" /></div></div>
            <h3 id="plan-essencial">Essencial</h3>
            <p className="s-plan-for">Para revisar Matemática e Natureza com a Operação 2º Domingo.</p>
            <ul className="s-checks">
              <li><b>Operação 2º Domingo:</b> {facts.questions} questões comentadas, {facts.simulados} simulados de {facts.simuladoQuestions} questões e {facts.treinos} treinos</li>
              <li>{facts.modules} revisões rápidas e {facts.formulas} fichas de fórmulas</li>
              <li>Minha revisão e caderno de erros</li>
              <li><b>4 e-books:</b> {essentialBooks.join(", ")}</li>
            </ul>
            <div className="s-price"><b>{brl(total("essencial"))}</b><span>no total · pagamento único</span><small>{brl(base("essencial"))} + {brl(SERVICE_FEE_CENTS)} de taxa do checkout</small></div>
            {buy("essencial", "Essencial")}
            <p className="s-plan-foot">Acesso pela plataforma · 7 dias de garantia</p>
          </article>

          <article className="s-plan s-plan-premium" aria-labelledby="plan-premium">
            <span className="s-badge">Mais completo</span>
            <div className="s-plan-media"><div className="s-stack"><Cover slug="fisica" /><Cover slug="quimica" /><Cover slug="redacao" /><Cover slug="matematica" /><i className="s-more">+12 e-books</i></div></div>
            <h3 id="plan-premium">Premium</h3>
            <p className="s-plan-for">Para ir além da Operação, com Física, Química e o banco geral.</p>
            <ul className="s-checks">
              <li><b>Tudo do Essencial</b>, incluindo a Operação 2º Domingo</li>
              <li><b>16 e-books</b>, incluindo Física, Química e Redação</li>
              <li><b>Banco geral:</b> {inv.generalDistinct} questões distintas em {inv.lists} listas e {inv.simulados} simulados (as questões se repetem entre coleções)</li>
              <li><b>Biblioteca histórica:</b> 1.800 referências de questões, com links para fontes oficiais (é um índice, não são resoluções autorais)</li>
              <li>Fichas e checklists da reta final</li>
            </ul>
            <div className="s-price"><b>{brl(total("premium"))}</b><span>no total · pagamento único</span><small>{brl(base("premium"))} + {brl(SERVICE_FEE_CENTS)} de taxa do checkout</small></div>
            {buy("premium", "Premium")}
            <p className="s-plan-foot">Acesso pela plataforma · 7 dias de garantia</p>
          </article>
        </div>

        <details className="s-compare">
          <summary>Ver a comparação completa entre os planos</summary>
          <div className="s-compare-body">
            <table>
              <thead><tr><th scope="col"><span className="sr-only">Item</span></th><th scope="col">Essencial</th><th scope="col">Premium</th></tr></thead>
              <tbody>
                <tr><th scope="row">Operação 2º Domingo</th><td data-l="Essencial">Incluída</td><td data-l="Premium">Incluída (igual)</td></tr>
                <tr><th scope="row">Minha revisão e caderno de erros</th><td data-l="Essencial">Incluídos</td><td data-l="Premium">Incluídos</td></tr>
                <tr><th scope="row">E-books</th><td data-l="Essencial">4: {essentialBooks.join(", ")}</td><td data-l="Premium">16, incluindo Física, Química e Redação</td></tr>
                <tr><th scope="row">Banco geral ({inv.generalDistinct} questões distintas, {inv.lists} listas, {inv.simulados} simulados)</th><td data-l="Essencial">Exercícios do plano, sem os {inv.simulados} simulados</td><td data-l="Premium">Completo</td></tr>
                <tr><th scope="row">Biblioteca histórica (1.800 referências com links)</th><td data-l="Essencial">Não incluída</td><td data-l="Premium">Incluída</td></tr>
                <tr><th scope="row">Fichas e checklists da reta final</th><td data-l="Essencial">Não incluídos</td><td data-l="Premium">Incluídos</td></tr>
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
    ["Qual a diferença entre o Essencial e o Premium?", <>Os dois incluem a Operação 2º Domingo inteira. O Essencial traz 4 e-books; o Premium traz os 16, incluindo Física, Química e Redação, além do banco geral ({inv.generalDistinct} questões distintas em {inv.lists} listas e {inv.simulados} simulados, que se repetem entre coleções), da biblioteca histórica (1.800 referências com links, um índice) e das fichas e checklists.</>],
    ["Quanto vou pagar no total?", <>Essencial: {essencialBase} + R$ 0,99 de taxa do checkout = <b>{essencialTotal}</b>. Premium: {premiumBase} + R$ 0,99 = <b>{premiumTotal}</b>. Pagamento único, sem mensalidade. É o valor que aparece na tela de pagamento.</>],
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
        <ThemeSwitch />
      </div>
    </section>
  );
}
