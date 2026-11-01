"use client";
import { useMemo, useState } from "react";
import type { PublicQuestion } from "../data/question-bank";

type Correction = Pick<PublicQuestion, "id" | "number" | "area"> & {
  selected: string;
  correct: boolean;
  correctAnswer: string;
  explanation: string;
  nextStep: string;
};

export default function AssessmentPlayer({ questions, title, subtitle, collectionId }: { questions: PublicQuestion[]; title: string; subtitle: string; collectionId?: string }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [index, setIndex] = useState(0);
  const [saveMessage, setSaveMessage] = useState("");
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const current = questions[index];
  const results = useMemo(() => corrections.map((correction) => ({ question: questions.find((question) => question.id === correction.id), ...correction })), [corrections, questions]);
  const correct = results.filter((item) => item.correct).length;
  const percent = questions.length ? Math.round(correct / questions.length * 100) : 0;
  const areas = useMemo(() => Object.entries(results.reduce<Record<string, { total: number; correct: number }>>((acc, item) => { if (!item.question) return acc; acc[item.question.area] ||= { total: 0, correct: 0 }; acc[item.question.area].total++; if (item.correct) acc[item.question.area].correct++; return acc; }, {})), [results]);
  async function finish() {
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const response = await fetch("/api/assessments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activity: questions[0]?.activity, collectionId, answers }) });
      const result = await response.json().catch(() => ({}));
      if (Array.isArray(result.corrections)) setCorrections(result.corrections);
      setSaveMessage(result.saved ? "Resultado salvo no seu histórico." : "Resultado calculado, mas não entrou no histórico. Tente novamente depois.");
    } catch {
      setSaveMessage("Resultado calculado, mas não entrou no histórico. Tente novamente depois.");
    }
  }
  if (!questions.length) return <div className="empty-state"><h2>Atividade em preparação</h2><p>O banco editorial desta trilha ainda está sendo revisado.</p></div>;
  if (submitted) return <section className="assessment-result" aria-labelledby="result-title"><div className="result-hero"><span className="eyebrow">Resultado concluído</span><h2 id="result-title">{corrections.length ? `Você acertou ${correct} de ${questions.length}` : "Processando sua correção"}</h2><strong>{corrections.length ? `${percent}%` : "…"}</strong><p>{corrections.length ? (percent >= 75 ? "Ótimo ritmo. Consolide os pontos em que perdeu segurança." : "Seu resultado indica pontos claros para a próxima sessão de revisão.") : "A correção está sendo conferida no servidor."}</p></div><p className="status-message" role="status">{saveMessage || "Salvando seu resultado…"}</p>{corrections.length > 0 && <><div className="assessment-grid">{areas.map(([area, data]) => <div className="assessment-stat" key={area}><strong>{Math.round(data.correct / data.total * 100)}%</strong><span>{area}</span><small>{data.correct}/{data.total} acertos</small></div>)}</div><div className="correction-list"><h3>Correção detalhada</h3>{results.map((item, i) => item.question ? <article className={item.correct ? "correction correct" : "correction wrong"} key={item.id}><div><b>Questão {i + 1} · {item.area}</b><span>{item.correct ? "Acerto" : "Resposta: " + (item.selected || "não respondida") + " · Gabarito: " + item.correctAnswer}</span></div><p>{item.explanation}</p>{!item.correct && <small>Próximo passo: {item.nextStep}.</small>}</article> : null)}</div></>}<button className="button secondary" onClick={() => { setSubmitted(false); setIndex(0); setAnswers({}); setCorrections([]); setSaveMessage(""); }}>Refazer atividade</button></section>;
  return <section className="assessment" aria-labelledby="assessment-title"><div className="assessment-head"><div><span className="eyebrow">Trilha interativa</span><h2 id="assessment-title">{title}</h2><p>{subtitle}</p></div><span className="assessment-counter">{index + 1} <small>/ {questions.length}</small></span></div><div className="progress-track" aria-label={"Questão " + (index + 1) + " de " + questions.length}><span style={{ width: ((index + 1) / questions.length * 100) + "%" }} /></div><div className="question-card"><div className="question-meta"><span>{current.area}</span><span>{current.topic}</span><span className={"difficulty " + (current.difficulty === "alta" ? "high" : "")}>{current.difficulty}</span></div><h3>{current.statement}</h3><fieldset><legend>Escolha uma alternativa</legend>{current.options.map((option) => <label className={answers[current.id] === option.id ? "option selected" : "option"} key={option.id}><input type="radio" name={current.id} checked={answers[current.id] === option.id} onChange={() => setAnswers((old) => ({ ...old, [current.id]: option.id }))} /><b>{option.id}</b><span>{option.text}</span></label>)}</fieldset></div><div className="assessment-actions"><button className="button secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>Anterior</button>{index < questions.length - 1 ? <button className="button primary" disabled={!answers[current.id]} onClick={() => setIndex(index + 1)}>Próxima questão</button> : <button className="button primary" disabled={Object.keys(answers).length !== questions.length} onClick={finish}>Ver correção</button>}</div><p className="assessment-source">{current.sourceLabel}. O resultado completo aparece ao finalizar.</p></section>;
}

