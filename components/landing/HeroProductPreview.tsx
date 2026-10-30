"use client";

import { useState } from "react";
import type { PublicQuestion } from "../../data/question-bank";
import styles from "./reel-hero.module.css";

export function HeroProductPreview({ question }: { question: PublicQuestion }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <article className={styles.productPreview} id="demo-questao" aria-labelledby="demo-title">
      <div className={styles.previewTopbar}>
        <div>
          <span className={styles.previewLabel}>Demonstração da plataforma</span>
          <strong id="demo-title">Pratique uma questão</strong>
        </div>
        <span className={styles.previewProgress}>01 <i>/ 05</i></span>
      </div>
      <div className={styles.previewMeta}>
        <span>{question.area}</span>
        <span>{question.topic}</span>
        <span>{question.difficulty}</span>
      </div>
      <p className={styles.previewStatement}>{question.statement}</p>
      <div className={styles.previewOptions} role="radiogroup" aria-label="Alternativas da questão">
        {question.options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected === option.id}
            className={selected === option.id ? styles.previewOptionSelected : styles.previewOption}
            onClick={() => setSelected(option.id)}
            data-analytics-event="hero_question_option"
          >
            <b>{option.id}</b>
            <span>{option.text}</span>
          </button>
        ))}
      </div>
      <div className={styles.previewFooter}>
        <span aria-live="polite">
          {selected ? `Alternativa ${selected} selecionada.` : "Escolha uma alternativa para experimentar."}
        </span>
        <a href="/entrar" data-analytics-event="hero_demo_login">Ver correção completa</a>
      </div>
    </article>
  );
}
