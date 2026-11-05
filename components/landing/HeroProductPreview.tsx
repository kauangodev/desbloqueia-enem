"use client";

import { useEffect, useMemo, useState } from "react";
import { questionBank, toPublicQuestion, type PublicQuestion } from "../../data/question-bank";
import styles from "./reel-hero.module.css";

export function HeroProductPreview({ question, demoAnswer, demoExplanation, demoNextStep: _demoNextStep }: {
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
  const [showReport, setShowReport] = useState(false);
  const currentQuestion = questions[currentIndex] || question;
  const selected = answers[currentIndex] || null;
  const answered = selected !== null;
  const score = Object.entries(answers).reduce((total, [index, answer]) => (
    total + (answer === privateQuestions[Number(index)]?.answer ? 1 : 0)
  ), 0);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("godev:demo-state", { detail: { currentIndex, answers, complete, showReport } }));
  }, [answers, complete, currentIndex, showReport]);

  function chooseAnswer(option: string) {
    if (complete) return;
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

  function restartDemo() {
    setCurrentIndex(0);
    setAnswers({});
    setComplete(false);
    setShowReport(false);
    delete document.documentElement.dataset.godevDemoReportReady;
  }

  useEffect(() => {
    if (!complete) return;
    const timer = window.setTimeout(() => {
      setShowReport(true);
      document.documentElement.dataset.godevDemoReportReady = "true";
      window.dispatchEvent(new CustomEvent("godev:demo-report-ready"));
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [complete]);

  if (complete) {
    const passed = score >= 3;
    const perfect = score === questions.length;
    return (
      <article className={`${styles.productPreview} ${styles.previewResult} ${showReport ? styles.previewReportVisible : styles.previewCelebration} ${passed ? styles.previewPassed : styles.previewNeedsPractice}`} id="demo-questao" aria-labelledby="demo-result-title">
        <div className={styles.previewResultIcon} aria-hidden="true">
          {passed ? (
            <svg viewBox="0 0 48 48" role="img"><circle cx="24" cy="24" r="20" /><path d="m14 24 7 7 14-15" /></svg>
          ) : (
            <svg viewBox="0 0 48 48" role="img"><circle cx="24" cy="24" r="20" /><path d="M16 31c4-5 12-5 16 0M17 19h.01M31 19h.01" /></svg>
          )}
        </div>
        <span className={styles.previewLabel}>{showReport ? "Demonstração concluída" : "Resultado da demonstração"}</span>
        {!showReport ? (
          <>
            <strong className={styles.previewResultTitle} id="demo-result-title">
              {perfect ? "Parabéns! Você fechou a demonstração." : passed ? "Muito bem! Você está no caminho certo." : "Poxa, ainda dá para evoluir."}
            </strong>
            <p className={styles.previewCelebrationHint} aria-live="polite">{passed ? "Sua conquista está sendo registrada." : "Cada tentativa é um novo passo para evoluir."}</p>
          </>
        ) : (
          <>
            <strong className={styles.previewResultTitle} id="demo-result-title">
              {passed ? "Você está no caminho certo!" : "Ainda dá para evoluir — vamos revisar?"}
            </strong>
            <p className={styles.previewResultScore}>Você acertou <b>{score} de {questions.length}</b> questões · <b>{score * 20}%</b> de aproveitamento.</p>
            <div className={styles.previewProgressTrack} aria-label={`${score * 20}% de aproveitamento`}><span style={{ width: `${score * 20}%` }} /></div>
            <p className={styles.previewResultNote}>{perfect ? "Excelente domínio nesta amostra." : passed ? "Continue praticando para transformar consistência em confiança." : "Revise as explicações e tente novamente para acompanhar sua evolução."}</p>
            {!passed && <div className={styles.previewFocusAreas} role="note">
              <strong>Prioridade para revisar</strong>
              <span>{questions.filter((item, index) => answers[index] !== privateQuestions[index]?.answer).map((item) => item.area).filter((area, index, areas) => areas.indexOf(area) === index).join(" · ") || "os fundamentos desta seleção"}</span>
            </div>}
          </>
        )}
        {showReport && <ol className={styles.previewReport} aria-label="Relatório das cinco questões">
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
        </ol>}
        {showReport && <div className={styles.previewResultActions}>
          <a className={styles.previewPrimaryButton} href="#planos">Conhecer os planos</a>
          <button className={styles.conversionSecondary} type="button" onClick={restartDemo}>Refazer demonstração</button>
        </div>}
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
            onKeyDown={(event) => {
              const optionIndex = currentQuestion.options.findIndex((item) => item.id === option.id);
              if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                event.preventDefault();
                const next = currentQuestion.options[(optionIndex + 1) % currentQuestion.options.length];
                chooseAnswer(next.id);
                document.getElementById(`demo-option-${next.id}`)?.focus();
              } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                event.preventDefault();
                const previous = currentQuestion.options[(optionIndex - 1 + currentQuestion.options.length) % currentQuestion.options.length];
                chooseAnswer(previous.id);
                document.getElementById(`demo-option-${previous.id}`)?.focus();
              } else if (event.key === "Enter") {
                event.preventDefault();
                nextQuestion();
              }
            }}
            id={`demo-option-${option.id}`}
            aria-label={`Alternativa ${option.id}: ${option.text}`}
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
        <a href="#planos" data-analytics-event="hero_demo_plans">Conhecer os planos</a>
      </div>
    </article>
  );
}



