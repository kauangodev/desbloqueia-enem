import styles from "./reel-hero.module.css";

export function HeroAnnotations() {
  return (
    <div className={styles.annotations} aria-hidden="true">
      <div className={`${styles.annotation} ${styles.annotationLeft}`}>
        <span>Revise por matéria</span>
        <svg viewBox="0 0 112 58">
          <path d="M5 6c27 2 57 12 76 36" />
          <path d="m70 39 13 5-1-14" />
        </svg>
      </div>
      <div className={`${styles.annotation} ${styles.annotationRight}`}>
        <span>Seu próximo passo começa aqui</span>
        <svg viewBox="0 0 122 65">
          <path d="M116 8C81 8 54 21 31 49" />
          <path d="m34 37-5 14 15-2" />
        </svg>
      </div>
    </div>
  );
}

