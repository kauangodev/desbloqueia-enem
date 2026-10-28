import Link from "next/link";
import { Header, Footer, MaterialPreview, FAQ } from "../components/site";
import { ReelHero } from "../components/landing/ReelHero";
import { DisciplineMarquee } from "../components/landing/DisciplineMarquee";
import { money } from "../lib/config";
import { publicPlans } from "../lib/catalog";
import { checkoutConfigured } from "../lib/readiness";
export const dynamic = "force-dynamic";
export const metadata = { alternates: { canonical: "/" } };
export default async function Home() {
  const plans = await publicPlans();
  const checkoutReady = checkoutConfigured();
  return (
    <>
      <Header />
      <main id="conteudo" className="landing-main">
        <ReelHero />
        <DisciplineMarquee />
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
                Conheça as capas dos 16 e-books didáticos reais.
                <br />
                Uma coleção organizada por área,
                <br />
                com 34 páginas por disciplina para consultar no seu ritmo.
              </p>
            </div>
            <MaterialPreview />
            <div className="library-note">
              <span>2016 — 2025</span>
              <p>
                <b>Conteúdo didático e prática ficam separados.</b> Os e-books
                apresentam a teoria; exercícios, simulados e histórico continuam
                nos módulos interativos da plataforma.
              </p>
              <span>
                16 e-books didáticos
                <br />30 simulados · 60 listas
                <br />1.800 questões de referência
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
              Conhecer o acesso do aluno
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
                Escolha a profundidade da sua preparação.
                <br />
                Pagamento único. Acesso vitalício ao plano.
                <br />
                Materiais independentes, sem promessa de nota ou aprovação.
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
                  <p className="plan-benefit">
                    {p.id === "premium"
                      ? "Para quem quer praticar mais, revisar com método e acompanhar a própria evolução."
                      : "Para quem quer organizar a base, recuperar o ritmo e estudar com clareza."}
                  </p>
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
                    href={checkoutReady ? `/api/checkout/${p.id}` : "/suporte"}
                  >
                    {checkoutReady ? `Escolher ${p.name}` : "Receber orientação"}
                  </Link>
                  <small className="plan-note">{checkoutReady ? "Pagamento seguro pela Cakto · acesso liberado após confirmação" : "Checkout em preparação · consulte o atendimento"}</small>
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
                Ler a política
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
