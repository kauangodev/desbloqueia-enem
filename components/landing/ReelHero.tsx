import Link from "next/link";
import { CurvedMaterialCarousel } from "./CurvedMaterialCarousel";
import { HeroAnnotations } from "./HeroAnnotations";
import styles from "./reel-hero.module.css";

export function ReelHero() {
  return (
    <section className={styles.hero} id="kit" aria-labelledby="hero-title">
      <div className={styles.intro}>
        <span className={styles.badge}>
          DESBLOQUEIA ENEM 2026 <i aria-hidden="true" /> KIT DIGITAL
        </span>
        <h1 id="hero-title">
          <span>Sua reta final,</span>
          <span>
            mais leve e <em>organizada.</em>
          </span>
        </h1>
        <p>
          Resumos por matéria, exercícios comentados, simulados e um cronograma
          para organizar sua revisão e aproveitar melhor cada sessão de estudo.
        </p>
      </div>

      <div className={styles.stage}>
        <HeroAnnotations />
        <CurvedMaterialCarousel />
      </div>

      <div className={styles.actions}>
        <div className={styles.primaryWrap}>
          <Link className={styles.primaryCta} href="#planos">
            Explorar os planos
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <Link className={styles.secondaryCta} href="#materiais">
          Conhecer os materiais
        </Link>
        <span className={styles.rhythmNote} aria-hidden="true">
          Estude no seu ritmo
        </span>
      </div>
      <p className={styles.supportLine}>
        Materiais digitais para estudar do celular ao computador.
      </p>
    </section>
  );
}

