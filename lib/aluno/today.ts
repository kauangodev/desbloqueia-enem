import { disciplineLabel, type Discipline } from "../operacao/types";

/**
 * "O que estudar hoje": uma ação principal com motivo e, quando conhecida, duração aproximada. Só usa dados reais do aluno.
 * Ordem: 1) retomar a sessão em andamento mais avançada; 2) revisões vencidas; 3) caderno de erros; 4) lacuna sustentada pelo
 * diagnóstico (mín. 2 questões, <60% na última tentativa); 5) primeiro treino de quem é novo; 6) próxima revisão de conteúdo;
 * 7) treino rápido. As demais opções aparecem como alternativas.
 */
export type TodaySession = { kind: string; id: string; answered: number; total: number; title: string };
export type TodayInput = {
  sessions: TodaySession[];
  reading?: { materialId: string; title: string; page: number } | null;
  flashDue: number;
  toReview: number;
  weak: { discipline: Discipline; topic: string; lastPct: number | null; answered: number }[];
  practiced: number;
  nextModule?: { id: string; title: string; minutes: number } | null;
  /** Média de minutos por questão no acervo (dado do catálogo). */
  minutesPerQuestion: number;
  basePath: string;
};

export type TodayAction = { id: string; kind: "sessao" | "leitura" | "revisao" | "erros" | "lacuna" | "primeiro" | "modulo" | "treino"; title: string; reason: string; minutes: number | null; href: string; cta: string };

const round = (value: number) => Math.max(1, Math.round(value));

export function todayPlan(input: TodayInput): { primary: TodayAction; others: TodayAction[] } {
  const perQuestion = input.minutesPerQuestion > 0 ? input.minutesPerQuestion : 2;
  const candidates: TodayAction[] = [];

  const sessions = [...input.sessions].sort((a, b) => b.answered / Math.max(b.total, 1) - a.answered / Math.max(a.total, 1) || b.answered - a.answered);
  for (const s of sessions) {
    const left = Math.max(s.total - s.answered, 0);
    candidates.push({ id: `sessao:${s.id}`, kind: "sessao", title: `Retomar: ${s.title}`, reason: `${s.answered} de ${s.total} questões respondidas. Suas respostas estão salvas.`, minutes: left ? round(left * perQuestion) : null, href: `${input.basePath}/treinos`, cta: "Retomar" });
  }
  if (input.flashDue > 0) {
    candidates.push({ id: "revisao", kind: "revisao", title: `Revisar ${input.flashDue} ${input.flashDue === 1 ? "cartão vencido" : "cartões vencidos"}`, reason: "Revisar na data certa é o que faz a fórmula ficar. Cada cartão leva poucos segundos.", minutes: null, href: "/aluno/flash-cards", cta: "Revisar agora" });
  }
  if (input.toReview > 0) {
    const n = Math.min(input.toReview, 5);
    candidates.push({ id: "erros", kind: "erros", title: `Refazer ${input.toReview === 1 ? "1 questão" : `${input.toReview} questões`} do caderno de erros`, reason: "Você errou na última tentativa. Releia a resolução e tente de novo.", minutes: round(n * perQuestion), href: `${input.basePath}/erros?s=erradas`, cta: "Abrir o caderno" });
  }
  const gap = input.weak[0];
  if (gap && input.practiced > 0) {
    candidates.push({ id: `lacuna:${gap.discipline}:${gap.topic}`, kind: "lacuna", title: `Reforçar ${gap.topic}`, reason: `${disciplineLabel[gap.discipline]}: ${gap.lastPct ?? 0}% de acerto atual em ${gap.answered} questões. É o ponto que mais pede revisão agora.`, minutes: round(5 * perQuestion), href: `/aluno/treino-rapido?d=${gap.discipline}`, cta: "Treinar este ponto" });
  }
  if (input.practiced === 0) {
    candidates.push({ id: "primeiro", kind: "primeiro", title: "Faça o seu primeiro treino", reason: "Cinco questões, com a resolução comentada de cada uma. Depois disso montamos o seu diagnóstico.", minutes: round(5 * perQuestion), href: "/aluno/treino-rapido", cta: "Começar" });
  }
  if (input.nextModule) {
    candidates.push({ id: `modulo:${input.nextModule.id}`, kind: "modulo", title: `Estudar: ${input.nextModule.title}`, reason: "Próxima revisão de conteúdo da sua trilha, com exemplo resolvido.", minutes: input.nextModule.minutes, href: `${input.basePath}/materiais/${input.nextModule.id}`, cta: "Abrir revisão" });
  }
  if (input.reading) {
    candidates.push({ id: `leitura:${input.reading.materialId}`, kind: "leitura", title: `Continuar a leitura: ${input.reading.title}`, reason: `Você parou na página ${input.reading.page}.`, minutes: null, href: `/aluno/ler/${input.reading.materialId}`, cta: "Continuar leitura" });
  }
  candidates.push({ id: "treino", kind: "treino", title: "Cinco questões rápidas", reason: "Um treino curto mantém a sequência e alimenta o seu diagnóstico.", minutes: round(5 * perQuestion), href: "/aluno/treino-rapido", cta: "Treinar" });

  const primary = candidates[0];
  // Alternativas nunca repetem o destino da ação principal nem entre si.
  // (Sessões em andamento compartilham a página de treinos, onde o aluno escolhe; por isso valem pelo id, não pelo destino.)
  const keyOf = (item: TodayAction) => (item.kind === "sessao" ? item.id : item.href);
  const seen = new Set([keyOf(primary)]);
  const others = candidates.slice(1).filter((item) => (seen.has(keyOf(item)) ? false : (seen.add(keyOf(item)), true))).filter((item) => item.kind === "sessao" || item.href !== primary.href).slice(0, 3);
  return { primary, others };
}
