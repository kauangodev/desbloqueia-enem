import { disciplineLabel, type Discipline } from "../operacao/types";

/**
 * "Seu próximo passo": uma ação principal com motivo e, quando conhecida, duração aproximada. Só usa dados reais do aluno.
 * Ordem de prioridade (a primeira que existir vence; as demais viram alternativas, no máximo 3):
 *  1. Sessão de treino/simulado em andamento (a mais avançada). Sessão antiga sem nenhuma resposta (3+ dias) NÃO domina: vai para o fim.
 *  2. Trilha ENEM: etapa em andamento ou próxima etapa da unidade atual (aluno novo começa pela Trilha).
 *  3. Revisões vencidas (flash cards).
 *  4. Caderno de erros (última tentativa errada).
 *  5. Lacuna sustentada pelo diagnóstico (mín. 2 questões, < 60% na última tentativa).
 *  6. Primeiro treino (aluno sem nenhuma questão e sem Trilha).
 *  7. Próxima revisão de conteúdo da Operação.
 *  8. Leitura em andamento e, por fim, treino rápido.
 */
export type TodaySession = { kind: string; id: string; answered: number; total: number; title: string; startedAt?: string };
export type TodayTrilha = { unitId: string; title: string; stageLabel: string; reason: string; href: string; minutes: number | null; started: boolean };
export type TodayInput = {
  sessions: TodaySession[];
  trilha?: TodayTrilha | null;
  reading?: { materialId: string; title: string; page: number } | null;
  flashDue: number;
  toReview: number;
  weak: { discipline: Discipline; topic: string; lastPct: number | null; answered: number }[];
  practiced: number;
  nextModule?: { id: string; title: string; minutes: number } | null;
  /** Média de minutos por questão no acervo (dado do catálogo). */
  minutesPerQuestion: number;
  basePath: string;
  /** Data de hoje (YYYY-MM-DD, America/Sao_Paulo) para detectar sessões antigas. */
  today?: string;
};

export type TodayAction = { id: string; kind: "sessao" | "trilha" | "leitura" | "revisao" | "erros" | "lacuna" | "primeiro" | "modulo" | "treino"; title: string; reason: string; minutes: number | null; href: string; cta: string };

export const STALE_SESSION_DAYS = 3;
const round = (value: number) => Math.max(1, Math.round(value));
const dayDiff = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000);

export function isStaleSession(session: TodaySession, today?: string) {
  if (!today || !session.startedAt || session.answered > 0) return false;
  const started = session.startedAt.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(started) && dayDiff(started, today) >= STALE_SESSION_DAYS;
}

export function todayPlan(input: TodayInput): { primary: TodayAction; others: TodayAction[] } {
  const perQuestion = input.minutesPerQuestion > 0 ? input.minutesPerQuestion : 2;
  const candidates: TodayAction[] = [];
  const stale: TodayAction[] = [];

  const sessions = [...input.sessions].sort((a, b) => b.answered / Math.max(b.total, 1) - a.answered / Math.max(a.total, 1) || b.answered - a.answered);
  for (const s of sessions) {
    const left = Math.max(s.total - s.answered, 0);
    const action: TodayAction = {
      id: `sessao:${s.id}`, kind: "sessao", title: `Retomar: ${s.title}`,
      reason: s.answered ? `${s.answered} de ${s.total} questões respondidas. Suas respostas estão salvas.` : `Iniciada e ainda sem respostas (${s.total} questões).`,
      minutes: left ? round(left * perQuestion) : null,
      // Leva à atividade certa: a página de treinos abre a sessão deste tipo.
      href: `${input.basePath}/treinos?abrir=${encodeURIComponent(s.kind)}`, cta: "Retomar",
    };
    (isStaleSession(s, input.today) ? stale : candidates).push(action);
  }
  if (input.trilha) {
    candidates.push({ id: `trilha:${input.trilha.unitId}`, kind: "trilha", title: input.trilha.started ? `Continuar a trilha: ${input.trilha.title}` : `Comece a trilha: ${input.trilha.title}`, reason: input.trilha.reason, minutes: input.trilha.minutes, href: input.trilha.href, cta: input.trilha.started ? "Continuar" : "Começar" });
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
    candidates.push({ id: `modulo:${input.nextModule.id}`, kind: "modulo", title: `Estudar: ${input.nextModule.title}`, reason: "Próxima revisão de conteúdo da Operação, com exemplo resolvido.", minutes: input.nextModule.minutes, href: `${input.basePath}/materiais/${input.nextModule.id}`, cta: "Abrir revisão" });
  }
  if (input.reading) {
    candidates.push({ id: `leitura:${input.reading.materialId}`, kind: "leitura", title: `Continuar a leitura: ${input.reading.title}`, reason: `Você parou na página ${input.reading.page}.`, minutes: null, href: `/aluno/ler/${input.reading.materialId}`, cta: "Continuar leitura" });
  }
  candidates.push(...stale);
  candidates.push({ id: "treino", kind: "treino", title: "Cinco questões rápidas", reason: "Um treino curto mantém a sequência e alimenta o seu diagnóstico.", minutes: round(5 * perQuestion), href: "/aluno/treino-rapido", cta: "Treinar" });

  const primary = candidates[0];
  // Alternativas nunca repetem a ação principal nem o destino uma da outra (sessões valem pelo id: compartilham a página de treinos).
  const keyOf = (item: TodayAction) => (item.kind === "sessao" ? item.id : item.href);
  const seen = new Set([keyOf(primary)]);
  const others = candidates.slice(1).filter((item) => (seen.has(keyOf(item)) ? false : (seen.add(keyOf(item)), true))).filter((item) => item.kind === "sessao" || item.href !== primary.href).slice(0, 3);
  return { primary, others };
}
