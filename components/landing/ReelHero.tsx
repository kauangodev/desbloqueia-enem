import Link from "next/link";
import { questionBank, toPublicQuestion } from "../../data/question-bank";
import { HeroProductPreview } from "./HeroProductPreview";
import { HeroVariantGate } from "./HeroVariantGate";
import styles from "./reel-hero.module.css";

export function ReelHero() {
  const question = toPublicQuestion(questionBank[0]);

  const conversion = (
    <section className={styles.conversionHero} id="kit" aria-labelledby="hero-title">
      <div className={styles.conversionGrid}>
        <div className={styles.conversionCopy}>
          <p className={styles.conversionKicker}>Desbloqueia ENEM 2026</p>
          <h1 id="hero-title">
            Prepare-se para o ENEM 2026 com método e clareza.
          </h1>
          <p className={styles.conversionLead}>
            Revisão, exercícios, simulados e acompanhamento em uma única plataforma
            para você estudar com direção até a prova.
          </p>
          <div className={styles.conversionActions}>
            <Link className={styles.conversionPrimary} href="#planos" data-analytics-event="hero_primary_cta">
              Conhecer os planos
            </Link>
            <a className={styles.conversionSecondary} href="#demo-questao" data-analytics-event="hero_demo_cta">
              Experimentar uma questão
            </a>
          </div>
          <ul className={styles.trustStrip} aria-label="Recursos da plataforma">
            <li><strong>2.100</strong><span>questões autorais</span></li>
            <li><strong>30</strong><span>simulados</span></li>
            <li><strong>16</strong><span>e-books didáticos</span></li>
          </ul>
        </div>
        <HeroProductPreview
          question={question}
          demoAnswer={questionBank[0].answer}
          demoExplanation={questionBank[0].explanation}
          demoNextStep={questionBank[0].nextStep}
        />
      </div>
      <div className={styles.conversionFootnote}>
        <span>Conteúdo para o ENEM 2026</span>
        <span>Estude no celular ou computador</span>
        <span>Conheça a plataforma antes de comprar</span>
      </div>
    </section>
  );

  return (
    <HeroVariantGate
      conversion={conversion}
    />
  );
}

