"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import QuestionCard from "../operacao/question-card";
import { post, useOperacaoState } from "../operacao/client";
import type { PublicQuestion } from "../../lib/operacao/types";

type Result = { correct: boolean; firstTry: boolean };

/** Sequência de questões do treino rápido: responde uma por vez (correção do servidor), com resumo no final. */
export default function RushPlayer({ questions, moduleTitles, basePath }: { questions: PublicQuestion[]; moduleTitles: Record<string, string>; basePath: string }) {
  const router = useRouter();
  const { state, patch } = useOperacaoState();
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [done, setDone] = useState(false);

  const q = questions[index];
  const answeredCount = Object.keys(results).length;
  const correct = Object.values(results).filter((r) => r.correct).length;
  const firstTry = Object.values(results).filter((r) => r.firstTry && r.correct).length;
  const xp = Object.values(results).filter((r) => r.firstTry).length * 10;

  async function toggle(kind: "fav" | "later", id: string) {
    patch((s) => ({ ...s, [kind]: s[kind].includes(id) ? s[kind].filter((x) => x !== id) : [...s[kind], id] }));
    try { await post({ action: "toggle", kind, ref: id }); } catch { /* o estado volta no próximo carregamento */ }
  }

  if (done) {
    const wrong = questions.filter((item) => results[item.id] && !results[item.id].correct);
    return (
      <section className="as-card" aria-labelledby="rush-end">
        <h2 id="rush-end">Treino concluído</h2>
        <p className="op-big">{correct} de {questions.length} <span>certas</span></p>
        <p className="as-muted">{firstTry} de primeira · +{xp} XP (só a 1ª tentativa de cada questão conta). Os erros foram para o seu caderno.</p>
        {wrong.length ? (
          <ul className="as-list" aria-label="Questões para rever">
            {wrong.map((item) => <li key={item.id}><span>{item.topic}</span>{item.moduleId ? <Link className="op-link" href={`${basePath}/materiais/${item.moduleId}`}>Rever: {moduleTitles[item.moduleId] || "módulo"}</Link> : null}</li>)}
          </ul>
        ) : <p>Você acertou todas. Que tal mais cinco?</p>}
        <div className="op-q-foot">
          <button type="button" className="as-btn as-btn-primary" onClick={() => router.refresh()}>Mais {questions.length} questões</button>
          <Link className="as-btn" href={`${basePath}/erros`}>Abrir meus erros</Link>
          <Link className="as-btn" href="/aluno/dashboard">Ver dashboard</Link>
        </div>
      </section>
    );
  }

  const answeredHere = Boolean(results[q.id]);
  return (
    <div className="as-page">
      <div className="as-meter" aria-label={`Questão ${index + 1} de ${questions.length}`}>
        <div className="as-meter-head"><strong>Questão {index + 1} de {questions.length}</strong><span className="as-muted">{answeredCount} respondida{answeredCount === 1 ? "" : "s"}</span></div>
        <span className="op-bar" role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answeredCount} aria-label="Progresso do treino"><i style={{ width: `${(answeredCount / questions.length) * 100}%` }} /></span>
      </div>
      <QuestionCard
        q={q}
        index={index}
        total={questions.length}
        moduleTitle={q.moduleId ? moduleTitles[q.moduleId] : undefined}
        basePath={basePath}
        favorite={Boolean(state?.fav.includes(q.id))}
        later={Boolean(state?.later.includes(q.id))}
        attemptCount={state?.attempts[q.id]?.n ?? 0}
        onToggle={toggle}
        onAnswered={(id, ok, first) => setResults((current) => ({ ...current, [id]: { correct: ok, firstTry: first } }))}
      />
      <div className="op-pager">
        <span />
        {index < questions.length - 1
          ? <button type="button" className="as-btn as-btn-primary" disabled={!answeredHere} onClick={() => setIndex(index + 1)}>Próxima questão</button>
          : <button type="button" className="as-btn as-btn-primary" disabled={!answeredHere} onClick={() => setDone(true)}>Ver resultado</button>}
      </div>
    </div>
  );
}
