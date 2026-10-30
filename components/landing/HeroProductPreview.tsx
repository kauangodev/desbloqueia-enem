"use client";

import { useMemo, useState } from "react";
import { questionBank, toPublicQuestion, type PublicQuestion } from "../../data/question-bank";
import styles from "./reel-hero.module.css";

export function HeroProductPreview({ question, demoAnswer, demoExplanation, demoNextStep }: {
  question: PublicQuestion;
  demoAnswer: string;
  demoExplanation: string;
  demoNextStep: string;
}) {
  const questions = useMemo(() => [
    question,
    ...questionBank.slice(1, 5).map(toPublicQuestion),
  ], [question]);
  const privateQuestions = questionBank.slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [complete, setComplete] = useState(false);
  const currentQuestion = questions[currentIndex] || question;
  const selected = answers[currentIndex] || null;
  const answered = selected !== null;
  const score = Object.entries(answers).reduce((total, [index, answer]) => (
    total + (answer === privateQuestions[Number(index)]?.answer ? 1 : 0)
  ), 0);

  function chooseAnswer(option: string) {
    if (answered || complete) return;
    setAnswers((current) => ({ ...current, [currentIndex]: option }));
  }

  function nextQuestion() {
    if (!answered) return;
    if (currentIndex === questions.length - 1) {
      setComplete(true);
      return;
    }
    setCurrentIndex((index) => index + 1);
  }

  function restart() {
    setAnswers({});
    setCurrentIndex(0);
    setComplete(false);
  }

  if (complete) {
    const passed = score >= 3;
    return (
      <article className={`${styles.productPreview} ${styles.previewResult}`} id="demo-questao" aria-labelledby="demo-result-title">
        <div className={styles.previewResultIcon} aria-hidden="true">
          {passed ? (
            <svg viewBox="0 0 48 48" role="img"><circle cx="24" cy="24" r="20" /><path d="m14 24 7 7 14-15" /></svg>
          ) : (
            <svg viewBox="0 0 48 48" role="img"><circle cx="24" cy="24" r="20" /><path d="M16 31c4-5 12-5 16 0M17 19h.01M31 19h.01" /></svg>
          )}
        </div>
        <span className={styles.previewLabel}>Demonstração concluída</span>
        <strong className={styles.previewResultTitle} id="demo-result-title">
          {passed ? "Você está no caminho certo!" : "Poxa, não foi dessa vez — ainda dá para evoluir."}
        </strong>
        <p className={styles.previewResultScore}>Você acertou <b>{score} de {questions.length}</b> questões · <b>{score * 20}%</b> de aproveitamento.</p>
        <div className={styles.previewProgressTrack} aria-label={`${score * 20}% de aproveitamento`}><span style={{ width: `${score * 20}%` }} /></div>
        <p className={styles.previewResultNote}>{passed ? "Continue praticando para transformar consistência em confiança." : "Revise as explicações e tente novamente para acompanhar sua evolução."}</p>
        <ol className={styles.previewReport} aria-label="Relatório das cinco questões">
          {questions.map((item, index) => {
            const answer = answers[index];
            const expected = privateQuestions[index]?.answer || demoAnswer;
            const correct = answer === expected;
            return (
              <li key={item.id} className={correct ? styles.previewReportCorrect : styles.previewReportMissed}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{correct ? "Acertou" : "Pode revisar"} · {item.area}</strong>
                  <small>Sua resposta: {answer || "não respondida"} · Gabarito: {expected}</small>
                  <p>{privateQuestions[index]?.explanation || demoExplanation}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <div className={styles.previewResultActions}>
          <button type="button" className={styles.previewPrimaryButton} onClick={restart}>Tentar novamente</button>
          <a className={styles.conversionSecondary} href="/entrar">Ver a plataforma completa</a>
        </div>
      </article>
    );
  }

  return (
    <article className={styles.productPreview} id="demo-questao" aria-labelledby="demo-title">
      <div className={styles.previewTopbar}>
        <div>
          <span className={styles.previewLabel}>Demonstração da plataforma</span>
          <strong id="demo-title">Pratique uma questão</strong>
        </div>
        <span className={styles.previewProgress} aria-label={`Questão ${currentIndex + 1} de ${questions.length} da demonstração`}>{String(currentIndex + 1).padStart(2, "0")} <i>/ {String(questions.length).padStart(2, "0")}</i></span>
      </div>
      <div className={styles.previewMeta}>
        <span>{currentQuestion.area}</span>
        <span>{currentQuestion.topic}</span>
        <span>{currentQuestion.difficulty}</span>
      </div>
      <p className={styles.previewStatement}>{currentQuestion.statement}</p>
      <div className={styles.previewOptions} role="radiogroup" aria-label="Alternativas da questão">
        {currentQuestion.options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected === option.id}
            className={selected === option.id ? styles.previewOptionSelected : styles.previewOption}
            onClick={() => chooseAnswer(option.id)}
            data-analytics-event="hero_question_answer"
          >
            <b>{option.id}</b>
            <span>{option.text}</span>
          </button>
        ))}
      </div>
      {answered && (
        <div className={styles.previewNextRow} role="status" aria-live="polite">
          <span>Alternativa {selected} selecionada. O resultado aparece no final.</span>
          <button type="button" className={styles.previewNextButton} onClick={nextQuestion}>
            {currentIndex === questions.length - 1 ? "Ver meu resultado" : "Próxima questão"}
          </button>
        </div>
      )}
      <div className={styles.previewFooter}>
        <span aria-live="polite">
          {selected ? "Você pode avançar quando estiver pronto." : "Escolha uma alternativa para experimentar."}
        </span>
        <a href="/entrar" data-analytics-event="hero_demo_login">Conhecer a plataforma</a>
      </div>
    </article>
  );
}

