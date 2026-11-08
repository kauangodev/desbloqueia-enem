import SessionCenter, { type Offer } from "../../../../components/operacao/session-center";
import { operacao } from "../../../../lib/operacao/config";
import { selectQuestions, type SessionKind } from "../../../../lib/operacao/engine";

export const metadata = { title: "Treinos e simulado — Operação 2º Domingo" };

const free = [{ id: "livre", label: "Livre (sem tempo)" }, { id: "cronometrado", label: "Cronometrado" }];
const defs: { kind: SessionKind; title: string; description: string; modes: Offer["modes"] }[] = [
  { kind: "diagnostico", title: "Diagnóstico (opcional)", description: "8 de Matemática e 8 de Natureza para descobrir por onde começar. Amostra pequena: serve como orientação, não como medida do seu nível.", modes: free },
  { kind: "treino-1", title: "Treino 1", description: "10 de Matemática + 10 de Natureza.", modes: free },
  { kind: "treino-2", title: "Treino 2", description: "10 de Matemática + 10 de Natureza, com seleção diferente do Treino 1.", modes: free },
  { kind: "treino-3", title: "Treino 3", description: "10 de Matemática + 10 de Natureza, priorizando o que você ainda não viu.", modes: free },
  { kind: "simulado", title: "Simulado", description: "Formato de 45 de Matemática + 45 de Natureza, com mapa de questões, marcação de dúvida, salvamento automático e retomada. A correção vem ao finalizar.", modes: [{ id: "prova", label: "Modo prova (cronômetro)" }, { id: "pratica", label: "Prática (sem tempo)" }] },
];

export default function TrainingPage() {
  const offers: Offer[] = defs.map((d) => {
    const pick = selectQuestions(d.kind, new Set());
    return { ...d, available: pick.ids.length, planned: pick.ids.length };
  });
  return (
    <div className="op-stack">
      <p className="op-card op-note">O cronômetro do modo prova é uma referência de estudo (≈ {operacao.simulado.referenceMinutes} min para 90 questões), não a duração oficial do Enem. Confira horários e regras no edital e no seu cartão de confirmação.</p>
      <SessionCenter offers={offers} basePath={operacao.basePath} />
    </div>
  );
}
