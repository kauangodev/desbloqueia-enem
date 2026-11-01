"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Answer = { label: string; value: string };
type Question = { id: string; title: string; hint: string; answers: Answer[] };

const questions: Question[] = [
  { id: "routine", title: "Em uma semana comum, quantos dias você consegue estudar?", hint: "Pense na sua rotina real, sem buscar a resposta ideal.", answers: [{ label: "1 ou 2 dias", value: "light" }, { label: "3 ou 4 dias", value: "steady" }, { label: "5 dias ou mais", value: "strong" }, { label: "Ainda estou organizando minha rotina", value: "start" }] },
  { id: "goal", title: "O que você mais quer fortalecer agora?", hint: "Escolha o ponto que mais ajudaria sua próxima semana.", answers: [{ label: "Construir uma base", value: "base" }, { label: "Ganhar ritmo de exercícios", value: "practice" }, { label: "Revisar e testar meu desempenho", value: "review" }, { label: "Organizar tudo em um só lugar", value: "organize" }] },
  { id: "areas", title: "Como você se sente ao estudar por áreas diferentes?", hint: "Não existe resposta certa nesta etapa.", answers: [{ label: "Preciso de um caminho mais claro", value: "guided" }, { label: "Já tenho uma rotina razoável", value: "steady" }, { label: "Quero aprofundar pontos específicos", value: "deep" }, { label: "Estou começando agora", value: "start" }] },
  { id: "practice", title: "Com que frequência você resolve questões?", hint: "Considere o que acontece de verdade hoje.", answers: [{ label: "Quase nunca", value: "light" }, { label: "Às vezes", value: "steady" }, { label: "Toda semana", value: "strong" }, { label: "Quero começar", value: "start" }] },
  { id: "feedback", title: "O que mais ajuda você a avançar?", hint: "A melhor ferramenta é a que cabe no seu jeito de aprender.", answers: [{ label: "Explicações claras", value: "explain" }, { label: "Exercícios para praticar", value: "practice" }, { label: "Um cronograma simples", value: "plan" }, { label: "Acompanhar meu progresso", value: "progress" }] },
  { id: "time", title: "Quanto tempo você costuma ter por sessão?", hint: "Escolha o intervalo mais próximo.", answers: [{ label: "Até 30 minutos", value: "short" }, { label: "Entre 30 e 60 minutos", value: "medium" }, { label: "Mais de uma hora", value: "long" }, { label: "Varia bastante", value: "varied" }] },
  { id: "materials", title: "Como você prefere revisar um conteúdo?", hint: "Isso ajuda a indicar uma sequência possível.", answers: [{ label: "Lendo uma síntese", value: "read" }, { label: "Resolvendo questões", value: "practice" }, { label: "Alternando teoria e prática", value: "mixed" }, { label: "Revendo meus erros", value: "review" }] },
  { id: "next", title: "Qual seria um próximo passo útil para você?", hint: "A resposta final será uma orientação, não uma promessa de resultado.", answers: [{ label: "Retomar a constância", value: "consistency" }, { label: "Praticar com mais intenção", value: "practice" }, { label: "Revisar o que já estudei", value: "review" }, { label: "Começar com organização", value: "organize" }] },
];

const STORAGE_KEY = "godev-study-routine-quiz";
const SESSION_KEY = "godev-quiz-session";

export default function StudyRoutineQuiz() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [complete, setComplete] = useState(false);

  function sendEvent(event: string, questionIndex?: number, signature = "") {
    try {
      let sessionHash = localStorage.getItem(SESSION_KEY);
      if (!sessionHash) {
        const session = crypto.randomUUID();
        sessionHash = session.replaceAll("-", "").padEnd(64, "0").slice(0, 64);
        localStorage.setItem(SESSION_KEY, sessionHash);
      }
      if ((event === "view" || event === "start") && sessionStorage.getItem(`godev-quiz-${event}`) === "1") return;
      if (event === "view" || event === "start") sessionStorage.setItem(`godev-quiz-${event}`, "1");
      const eventId = `${sessionHash.slice(0, 12)}:${event}:${questionIndex ?? "all"}:${signature}`.slice(0, 80);
      void fetch("/api/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event, eventId, questionIndex, sessionHash }), keepalive: true }).catch(() => undefined);
    } catch { /* analytics remains optional */ }
  }

  useEffect(() => {
    sendEvent("view");
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as { answers?: Record<string, string>; complete?: boolean } | null;
      if (saved?.answers) setAnswers(saved.answers);
      if (saved?.complete) router.replace("/landing");
    } catch { /* local state remains available */ }
  }, [router]);

  const current = questions[index];
  const selected = answers[current.id];
  const score = useMemo(() => Object.values(answers).reduce((total, value) => total + (["strong", "review", "mixed", "progress", "consistency"].includes(value) ? 1 : 0), 0), [answers]);

  function save(nextAnswers: Record<string, string>, done = complete) {
    setAnswers(nextAnswers);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: nextAnswers, complete: done }));
  }

  function finish() {
    sendEvent("complete");
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, complete: true }));
    router.push("/landing");
  }

  if (complete) {
    const title = score >= 4 ? "Seu próximo passo é praticar com constância." : "Seu próximo passo é começar com clareza.";
    const body = score >= 4 ? "Você já identificou bons hábitos. Organize teoria, exercícios e revisões em uma sequência possível para sua semana." : "Uma rotina simples, com materiais organizados e pequenas etapas, pode ajudar você a sair do improviso e ganhar ritmo.";
    return <section className="study-quiz study-quiz-result" id="diagnostico" aria-labelledby="study-quiz-result-title">
      <div className="study-quiz-result-mark" aria-hidden="true">✓</div>
      <span className="eyebrow">Seu ponto de partida</span>
      <h2 id="study-quiz-result-title">{title}</h2>
      <p>{body}</p>
      <div className="study-quiz-result-actions"><Link className="button primary" href="#planos" data-analytics-event="study_quiz_result_plans" onClick={() => sendEvent("plans")}>Conhecer os planos</Link><button className="button secondary" type="button" onClick={() => { setIndex(0); setComplete(false); localStorage.removeItem(STORAGE_KEY); sendEvent("start"); }} data-analytics-event="study_quiz_restart">Refazer diagnóstico</button></div>
    </section>;
  }

  return <section className="study-quiz" id="diagnostico" aria-labelledby="study-quiz-title">
    <div className="study-quiz-heading"><span className="eyebrow">Seu ponto de partida</span><h2 id="study-quiz-title">Vamos entender sua <em>rotina</em> de estudos?</h2><p>Responda 8 perguntas rápidas sobre sua preparação para o ENEM e descubra um próximo passo possível para você.</p></div>
    <div className="study-quiz-grid">
    <div className="study-quiz-card">
      <div className="study-quiz-card-head"><span>Pergunta {index + 1} de {questions.length}</span><span>{Math.round(((index + 1) / questions.length) * 100)}%</span></div>
      <div className="study-quiz-progress" aria-hidden="true"><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>
      <h3>{current.title}</h3><p className="study-quiz-hint">{current.hint}</p>
      <div className="study-quiz-options" role="radiogroup" aria-label="Respostas">
        {current.answers.map((answer) => <button key={answer.value} type="button" role="radio" aria-checked={selected === answer.value} className={selected === answer.value ? "is-selected" : ""} onClick={() => { save({ ...answers, [current.id]: answer.value }); if (!Object.keys(answers).length) sendEvent("start"); sendEvent("answer", index, answer.value); }} data-analytics-event="study_quiz_answer"><span className="study-quiz-radio" aria-hidden="true" />{answer.label}</button>)}
      </div>
      <div className="study-quiz-card-foot"><button className="button secondary" type="button" disabled={index === 0} onClick={() => { setIndex((value) => value - 1); sendEvent("back", index); }}>Anterior</button>{index < questions.length - 1 ? <button className="button primary" type="button" disabled={!selected} onClick={() => { setIndex((value) => value + 1); sendEvent("next", index); }}>Continuar <span aria-hidden="true">→</span></button> : <button className="button primary" type="button" disabled={!selected} onClick={finish}>Ver meu próximo passo <span aria-hidden="true">→</span></button>}</div>
    </div>
    <aside className="study-quiz-aside" aria-label="Etapas do diagnóstico">
      <div className="study-quiz-aside-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19V10m5 9V5m5 14v-7m5 7V3" /></svg></div>
      <h3>No seu ritmo</h3>
      <p>As próximas perguntas ajudam a entender seu tempo, seus objetivos e seus desafios.</p>
      <ol>{["Sua rotina de estudos", "Seus objetivos no ENEM", "Suas áreas de foco", "Como você estuda", "Seus principais desafios", "Seu tempo disponível", "Recursos que você usa", "Seu próximo passo"].map((label, step) => <li key={label} className={step === index ? "is-current" : step < index ? "is-done" : ""}><span>{step + 1}</span>{label}</li>)}</ol>
    </aside>
    </div>
  </section>;
}

