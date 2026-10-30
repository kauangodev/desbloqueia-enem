"use client";

import { useState } from "react";
import type { PublicQuestion } from "../../data/question-bank";
import styles from "./reel-hero.module.css";

export function HeroProductPreview({ question, demoAnswer, demoExplanation, demoNextStep }: {
  question: PublicQuestion;
  demoAnswer: string;
  demoExplanation: string;
  demoNextStep: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const answered = selected !== null;
  const isCorrect = selected === demoAnswer;

  return (
    <article className={styles.productPreview} id="demo-questao" aria-labelledby="demo-title">
      <div className={styles.previewTopbar}>
        <div>
          <span className={styles.previewLabel}>Demonstração da plataforma</span>
          <strong id="demo-title">Pratique uma questão</strong>
        </div>
        <span className={styles.previewProgress} aria-label="Questão 1 de 5 da demonstração">01 <i>/ 05</i></span>
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
      {answered && (
        <div className={isCorrect ? styles.previewFeedbackCorrect : styles.previewFeedback} role="status" aria-live="polite">
          <div className={styles.previewFeedbackHeading}>
            <strong>{isCorrect ? "Resposta correta" : "Quase lá — revise este ponto"}</strong>
            <span>{isCorrect ? "+25 XP" : "Próximo passo"}</span>
          </div>
          <p>{isCorrect ? demoExplanation : `A resposta correta é a alternativa ${demoAnswer}. ${demoExplanation}`}</p>
          <div className={styles.previewProgressLabel}><span>Progresso demonstrativo</span><b>{isCorrect ? "45%" : "25%"}</b></div>
          <div className={styles.previewProgressTrack} aria-label={`${isCorrect ? 45 : 25}% de progresso demonstrativo`}><span style={{ width: `${isCorrect ? 45 : 25}%` }} /></div>
          <small>Próximo desafio: {demoNextStep}</small>
        </div>
      )}
      <div className={styles.previewFooter}>
        <span aria-live="polite">
          {selected ? `Alternativa ${selected} selecionada. ${isCorrect ? "Você avançou na revisão." : "Confira a explicação abaixo."}` : "Escolha uma alternativa para experimentar."}
        </span>
        <a href="/entrar" data-analytics-event="hero_demo_login">Ver correção completa</a>
      </div>
    </article>
  );
}
