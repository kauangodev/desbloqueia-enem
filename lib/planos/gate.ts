import { consumeDaily, type QuotaUse } from "./model";

/**
 * Regras do plano Grátis aplicadas no SERVIDOR (puras e testáveis). O Grátis vê a unidade introdutória da Trilha, as questões
 * do módulo dessa unidade (com cota diária) e o diagnóstico. Tudo fora disso responde 403 com a alternativa (Essencial).
 */
export type FreeScope = { unitId: string; moduleId: string; questionsPerDay: number; sessionKinds: string[] };

export type Decision = { allowed: true } | { allowed: false; message: string };
const deny = (message: string): Decision => ({ allowed: false, message });
const UPGRADE = "Este conteúdo faz parte do plano Essencial.";

export function freeUnitDecision(scope: FreeScope, unitId: string): Decision {
  return unitId === scope.unitId ? { allowed: true } : deny(`${UPGRADE} No Grátis você tem a unidade introdutória da Trilha.`);
}

export function freeSessionDecision(scope: FreeScope, kind: string): Decision {
  return scope.sessionKinds.includes(kind) ? { allowed: true } : deny(`${UPGRADE} No Grátis você pode fazer o diagnóstico.`);
}

export const freeQuestionVisible = (scope: FreeScope, question: { moduleId: string }) => question.moduleId === scope.moduleId;

/** Resposta avulsa: só questões do módulo grátis, dentro da cota diária. `uses` vem do armazenamento do aluno. */
export function freeAnswerDecision(scope: FreeScope, question: { id: string; moduleId: string }, uses: QuotaUse[], day: string): { decision: Decision; uses: QuotaUse[]; remaining: number | null } {
  if (!freeQuestionVisible(scope, question)) return { decision: deny(`${UPGRADE} No Grátis você resolve as questões da unidade introdutória.`), uses, remaining: null };
  const result = consumeDaily(uses, question.id, day, scope.questionsPerDay);
  if (!result.allowed) return { decision: deny(`Você usou as ${scope.questionsPerDay} questões grátis de hoje. Elas renovam amanhã (horário de Brasília) ou você pode assinar o Essencial.`), uses, remaining: 0 };
  return { decision: { allowed: true }, uses: result.uses, remaining: result.remaining };
}
