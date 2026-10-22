import Image from "next/image";
import Link from "next/link";
import { Header, Footer, MaterialPreview, FAQ } from "../components/site";
import { money } from "../lib/config";
import { publicPlans } from "../lib/catalog";
export const dynamic = "force-dynamic";
export const metadata = { alternates: { canonical: "/" } };
export default async function Home() {
  const plans = await publicPlans();
  return (
    <>
      <Header />
      <main id="conteudo">
        <section className="hero container" id="kit">
          <div className="hero-copy">
            <div className="product-label">
              <span />
              Desbloqueia ENEM 2026
            </div>
            <h1>
              Sua reta final
              <br />
              do ENEM,
              <br />
              <span>
                organizada em
                <br />
                um só lugar.
              </span>
            </h1>
            <p>
              Tenha acesso a resumos, exercícios comentados, simulados e um
              cronograma de estudos para revisar com mais organização e
              praticidade.
            </p>
            <div className="hero-actions">
              <Link className="button primary" href="#planos">
                Conhecer os planos
              </Link>
              <Link className="text-link" href="#materiais">
                Explorar os materiais <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className="hero-footnote">
              <span>Feito para o seu ritmo.</span>
              <span>Do celular ao computador.</span>
            </div>
          </div>
          <div className="hero-art">
            <div className="art-heading">
              <span>SUA PRÓXIMA ETAPA.</span>
              <span>EDIÇÃO 2026</span>
            </div>
            <div className="cover-composition">
              <Image
                className="cover rear-cover"
                src="/covers/matematica.png"
                width={290}
                height={411}
                alt="Capa real do caderno de Matemática"
                priority
              />
              <Image
                className="cover main-cover"
                src="/covers/kit.png"
                width={350}
                height={496}
                alt="Capa real do Kit Reta Final ENEM 2026"
                priority
              />
            </div>
            <div className="art-bottom">
              <div>
                <span className="art-line" />
                Menos dispersão.
                <br />
                <b>Mais direção.</b>
              </div>
              <span className="edition-seal">
                REVISAR
                <br />
                PRATICAR
                <br />
                AVANÇAR
              </span>
            </div>
          </div>
        </section>
        <div className="discipline-strip">
          <div className="container">
            <span>Linguagens</span>
            <span>Ciências Humanas</span>
            <span>Ciências da Natureza</span>
            <span>Matemática</span>
            <span>Redação</span>
          </div>
        </div>
        <section className="container section intro-section">
          <h2>
            O conteúdo importa.
            <br />
            <span>O caminho também.</span>
          </h2>
          <div>
            <p className="large-copy">
              Revisar não precisa ser uma coleção de abas abertas. Reúna o
              material, encontre seu próximo passo e dê continuidade ao que
              começou.
            </p>
            <div className="benefit-lines">
              <p>
                <b>Organize sua revisão.</b>
                <span>Um lugar para encontrar seus materiais.</span>
              </p>
              <p>
                <b>Pratique com intenção.</b>
                <span>Exercícios e simulados para trabalhar o conteúdo.</span>
              </p>
              <p>
                <b>Continue de onde parou.</b>
                <span>Leitura e tarefas com progresso salvo na sua conta.</span>
              </p>
            </div>
          </div>
        </section>
        <section className="materials-section" id="materiais">
          <div className="container section">
            <div className="section-heading">
              <h2>
                Abra espaço
                <br />
                para aprender.
              </h2>
              <p>
                Conheça as capas dos materiais reais.
                <br />
                Uma coleção organizada por área,
                <br />
                com conteúdo para consultar no seu ritmo.
              </p>
            </div>
            <MaterialPreview />
            <div className="library-note">
              <span>2016 — 2025</span>
              <p>
                <b>A história da prova também ensina.</b> O Premium inclui a
                biblioteca navegável de referências do ENEM, com filtros, fontes
                oficiais e indicação do que já foi resolvido.
              </p>
              <span>
                1.800 referências
                <br />7 resoluções autorais
              </span>
            </div>
          </div>
        </section>
        <section className="container section study-section">
          <div>
            <h2>
              Um estudo que
              <br />
              <span>acompanha você.</span>
            </h2>
            <p>
              Seus cadernos, uma agenda de revisão e a próxima página. A área do
              aluno conecta pequenas etapas para ajudar você a manter a rotina.
            </p>
            <Link href="/entrar" className="text-link">
              Conhecer o acesso do aluno <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="study-outline">
            <div className="outline-top">
              <b>Seu espaço de estudo</b>
              <span>Desbloqueia ENEM</span>
            </div>
            <div className="outline-row">
              <span>01</span>
              <div>
                <b>Escolha o material</b>
                <p>Navegue por disciplina e conteúdo do seu plano.</p>
              </div>
            </div>
            <div className="outline-row">
              <span>02</span>
              <div>
                <b>Faça uma etapa por vez</b>
                <p>Leia, pratique e organize suas tarefas.</p>
              </div>
            </div>
            <div className="outline-row">
              <span>03</span>
              <div>
                <b>Retome seu caminho</b>
                <p>Volte à página salva na próxima sessão.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="pricing-section" id="planos">
          <div className="container section">
            <div className="section-heading">
              <h2>
                Escolha seu
                <br />
                próximo passo.
              </h2>
              <p>
                Do essencial à revisão completa.
                <br />
                Pagamento único. Materiais digitais.
                <br />
                Sem promessa de nota ou aprovação.
              </p>
            </div>
            <div className="pricing-grid">
              {plans.map((p) => (
                <article
                  key={p.id}
                  className={`price-card ${p.id === "premium" ? "premium" : ""}`}
                >
                  <div className="plan-title">
                    <h3>{p.name}</h3>
                    {p.id === "premium" && <span>Mais completo</span>}
                  </div>
                  <p>{p.description}</p>
                  <div className="price">
                    {money(p.cents)}
                    <small>pagamento único</small>
                  </div>
                  <ul>
                    {p.features.map((f) => (
                      <li key={f}>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          aria-hidden="true"
                        >
                          <path d="m5 12 4 4L19 6" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    className={`button ${p.id === "premium" ? "lime" : "secondary"}`}
                    href={`/comprar/${p.id}`}
                  >
                    Escolher {p.name}
                  </Link>
                  <small className="plan-note">Vendas em preparação</small>
                </article>
              ))}
            </div>
            <div className="guarantee">
              <div className="guarantee-number">
                7<span>DIAS</span>
              </div>
              <div>
                <h3>
                  Compre com tranquilidade.
                  <br />
                  Você tem 7 dias de garantia.
                </h3>
                <p>
                  Consulte como solicitar o reembolso e as condições de acesso.
                </p>
              </div>
              <Link className="text-link" href="/politicas/reembolso">
                Ler a política <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </section>
        <section className="container section faq-section" id="duvidas">
          <div>
            <h2>
              Antes de
              <br />
              <span>começar.</span>
            </h2>
            <p>
              Respostas para estudar
              <br />
              com mais clareza.
            </p>
            <Link className="text-link" href="/suporte">
              Falar com o atendimento
            </Link>
          </div>
          <FAQ />
        </section>
        <section className="closing container">
          <h2>
            Um próximo passo.
            <br />
            Uma revisão mais organizada.
          </h2>
          <Link href="#planos" className="button primary">
            Encontrar meu plano
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
