import SessionCenter, { type Offer } from "../../../../components/operacao/session-center";
import { operacao } from "../../../../lib/operacao/config";
import { selectQuestions } from "../../../../lib/operacao/engine";
import { kindIds, referenceMinutes, sessionKinds } from "../../../../lib/operacao/kinds";

export const metadata = { title: "Treinos e simulados — Operação 2º Domingo" };

const free = [{ id: "livre", label: "Livre (sem tempo)" }, { id: "cronometrado", label: "Cronometrado" }];
const exam = [{ id: "prova", label: "Modo prova (cronômetro)" }, { id: "pratica", label: "Prática (sem tempo)" }];

export default function TrainingPage() {
  const offers: Offer[] = kindIds.map((kind) => {
    const def = sessionKinds[kind];
    const planned = selectQuestions(kind, new Set()).ids.length;
    const minutes = referenceMinutes(kind);
    return {
      kind, group: def.group, title: def.title, description: def.objective, planned,
      modes: def.group === "simulado" ? exam : free,
      questionsLabel: `${planned} questões (${def.per} de Matemática + ${def.per} de Natureza)`,
      durationLabel: def.group === "simulado" ? `Referência: ${minutes / 60} h no modo prova (não é a duração oficial)` : `Referência: ${minutes} min no modo cronometrado`,
    };
  });
  const order = { simulado: 0, treino: 1, diagnostico: 2 } as const;
  offers.sort((a, b) => order[a.group] - order[b.group]);
  return (
    <div className="op-stack">
      <p className="op-card op-note">O cronômetro do modo prova é uma referência de estudo (≈ {operacao.simulado.referenceMinutes} min para 90 questões), não a duração oficial do Enem. Confira horários e regras no edital e no seu cartão de confirmação.</p>
      <SessionCenter offers={offers} basePath={operacao.basePath} />
    </div>
  );
}
