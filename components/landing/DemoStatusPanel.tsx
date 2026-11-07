"use client";

import { useEffect, useState } from "react";

type DemoState = {
  currentIndex: number;
  answers: Record<number, string>;
  complete: boolean;
  showReport: boolean;
};

const initialState: DemoState = { currentIndex: 0, answers: {}, complete: false, showReport: false };

export function DemoStatusPanel() {
  const [state, setState] = useState<DemoState>(initialState);

  useEffect(() => {
    const handleState = (event: Event) => {
      const detail = (event as CustomEvent<DemoState>).detail;
      if (detail) setState(detail);
    };
    window.addEventListener("godev:demo-state", handleState);
    return () => window.removeEventListener("godev:demo-state", handleState);
  }, []);

  return (
    <aside className="demo-aside" aria-label="Status da demonstração">
      <span className={`demo-tab ${!state.showReport ? "is-active" : ""}`}>Questão</span>
      <span className={`demo-tab ${state.showReport ? "is-active" : ""}`}>Resumo ao final</span>
      {!state.complete ? (
        <>
          <div className="demo-status"><span /> {state.answers[state.currentIndex] ? `Alternativa ${state.answers[state.currentIndex]} selecionada` : "Escolha uma alternativa"}</div>
          <div className="demo-status"><span className="answered" /> {Object.keys(state.answers).length} de 5 respondidas</div>
        </>
      ) : (
        <div className="demo-status demo-status-result"><span className="answered" /> {state.showReport ? "Resultado liberado" : "Preparando seu resultado…"}</div>
      )}
      <div className="demo-number-grid" aria-label="Progresso das cinco questões">
        {Array.from({ length: 5 }, (_, index) => {
          const answered = Boolean(state.answers[index]);
          const current = !state.complete && index === state.currentIndex;
          return <span key={index} className={`${current ? "is-active" : ""} ${answered ? "is-answered" : ""}`} aria-current={current ? "step" : undefined} aria-label={`Questão ${index + 1}, ${current ? "atual" : answered ? "respondida" : "não respondida"}`}>{index + 1}</span>;
        })}
      </div>
      <small className="demo-aside-note">{state.showReport ? "Confira o resumo e conheça os próximos passos." : "O resultado e as explicações aparecem depois da quinta questão."}</small>
    </aside>
  );
}
