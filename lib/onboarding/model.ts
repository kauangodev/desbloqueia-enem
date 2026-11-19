/**
 * Onboarding de 3 etapas (puro e testável). O estado fica em `operacao_state` (kind "onboarding", ref "v1"), por aluno, no servidor:
 * progresso, respostas e conclusão sobrevivem a recarregar, trocar de aparelho ou sair da conta.
 *
 * Etapa 1: data de nascimento (obrigatória; é um dado pessoal e só é usada para adequar a experiência).
 * Etapa 2: objetivo (nota atual/meta opcionais; "não sei" é null, nunca zero).
 * Etapa 3: ritmo diário (opcional).
 *
 * Esta camada NÃO decide política etária: só valida plausibilidade. A regra para menores depende de revisão jurídica (LGPD/ECA Digital)
 * e de um mecanismo de aferição que ainda não existe; por isso nada aqui concede ou nega acesso por idade.
 */
export const ONBOARDING_VERSION = 1;
export const SCORE_MAX = 1000;
export const MIN_PLAUSIBLE_AGE = 10;
export const MAX_PLAUSIBLE_AGE = 100;

export const ROUTINES = {
  leve: { label: "Leve", questions: 3, text: "Para manter o hábito, com poucos minutos por dia." },
  regular: { label: "Regular", questions: 6, text: "Um ritmo equilibrado para a maior parte dos dias." },
  intenso: { label: "Intenso", questions: 10, text: "Para quem quer avançar mais rápido." },
} as const;
export type RoutineId = keyof typeof ROUTINES | "personalizado";
export const CUSTOM_MIN = 1;
export const CUSTOM_MAX = 30;

export type OnboardingState = {
  version: number;
  step: 1 | 2 | 3;
  birthDate: string | null;
  scoreCurrent: number | null;
  scoreUnknown: boolean;
  scoreTarget: number | null;
  futureExams: string[];
  routine: RoutineId | null;
  dailyQuestions: number | null;
  skipped: (2 | 3)[];
  completedAt: string | null;
  updatedAt: string | null;
};

export const emptyState = (): OnboardingState => ({
  version: ONBOARDING_VERSION, step: 1, birthDate: null, scoreCurrent: null, scoreUnknown: false, scoreTarget: null,
  futureExams: [], routine: null, dailyQuestions: null, skipped: [], completedAt: null, updatedAt: null,
});

/** Interesses futuros: só sinalizam o que a pessoa quer; nenhum deles significa conteúdo disponível hoje. */
export const FUTURE_EXAMS = ["Unicamp", "FUVEST", "Unesp", "FGV", "Insper", "ITA", "IME"] as const;

export type Check<T> = { ok: true; value: T } | { ok: false; error: string };
const bad = <T>(error: string): Check<T> => ({ ok: false, error });

/** Data civil AAAA-MM-DD, real no calendário (bissextos incluídos), não futura e com idade plausível. Sem fuso: é só uma data. */
export function validateBirthDate(input: unknown, today: string): Check<string> {
  if (typeof input !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return bad("Informe a data no formato dia/mês/ano.");
  const [y, m, d] = input.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) return bad("Essa data não existe no calendário.");
  if (input > today) return bad("A data de nascimento não pode estar no futuro.");
  const age = ageOn(input, today);
  if (age < MIN_PLAUSIBLE_AGE) return bad("Confira a data: não conseguimos continuar com essa idade.");
  if (age > MAX_PLAUSIBLE_AGE) return bad("Confira o ano de nascimento.");
  return { ok: true, value: input };
}

/** Idade completa na data `on` (AAAA-MM-DD), por comparação de datas civis. */
export function ageOn(birth: string, on: string): number {
  const [by, bm, bd] = birth.split("-").map(Number);
  const [oy, om, od] = on.split("-").map(Number);
  return oy - by - (om < bm || (om === bm && od < bd) ? 1 : 0);
}

const score = (v: unknown): Check<number | null> => {
  if (v === null || v === undefined || v === "") return { ok: true, value: null };
  if (typeof v !== "number" || !Number.isFinite(v) || !Number.isInteger(v) || v < 0 || v > SCORE_MAX) return bad(`A nota deve ser um número inteiro de 0 a ${SCORE_MAX}.`);
  return { ok: true, value: v };
};

export type GoalsInput = { scoreCurrent?: unknown; scoreUnknown?: unknown; scoreTarget?: unknown; futureExams?: unknown };
export function validateGoals(input: GoalsInput): Check<Pick<OnboardingState, "scoreCurrent" | "scoreUnknown" | "scoreTarget" | "futureExams">> {
  const unknown = input.scoreUnknown === true;
  const current = unknown ? ({ ok: true, value: null } as Check<number | null>) : score(input.scoreCurrent);
  if (!current.ok) return current;
  const target = score(input.scoreTarget);
  if (!target.ok) return target;
  const exams = Array.isArray(input.futureExams) ? input.futureExams : [];
  if (exams.length > FUTURE_EXAMS.length || exams.some((e) => typeof e !== "string" || !(FUTURE_EXAMS as readonly string[]).includes(e))) return bad("Escolha apenas exames da lista.");
  return { ok: true, value: { scoreCurrent: current.value, scoreUnknown: unknown, scoreTarget: target.value, futureExams: [...new Set(exams as string[])] } };
}

export function validateRoutine(routine: unknown, custom: unknown): Check<{ routine: RoutineId; dailyQuestions: number }> {
  if (routine === "personalizado") {
    if (typeof custom !== "number" || !Number.isInteger(custom) || custom < CUSTOM_MIN || custom > CUSTOM_MAX) return bad(`Escolha de ${CUSTOM_MIN} a ${CUSTOM_MAX} questões por dia.`);
    return { ok: true, value: { routine: "personalizado", dailyQuestions: custom } };
  }
  if (typeof routine === "string" && routine in ROUTINES) return { ok: true, value: { routine: routine as keyof typeof ROUTINES, dailyQuestions: ROUTINES[routine as keyof typeof ROUTINES].questions } };
  return bad("Escolha um ritmo.");
}

export type StepInput =
  | { step: 1; birthDate: unknown }
  | ({ step: 2; skip?: boolean } & GoalsInput)
  | { step: 3; skip?: boolean; routine?: unknown; custom?: unknown };

/**
 * Aplica uma etapa ao estado e devolve o novo estado. A etapa 1 é obrigatória; as 2 e 3 podem ser puladas.
 * Concluir a etapa 3 (salvando ou pulando) marca o onboarding como concluído. Não regride: refazer uma etapa mantém o avanço.
 */
export function applyStep(state: OnboardingState, input: StepInput, today: string, nowIso: string): Check<OnboardingState> {
  const next: OnboardingState = { ...state, skipped: [...state.skipped], updatedAt: nowIso };
  if (input.step === 1) {
    const birth = validateBirthDate(input.birthDate, today);
    if (!birth.ok) return birth;
    next.birthDate = birth.value;
    next.step = Math.max(state.step, 2) as 1 | 2 | 3;
    return { ok: true, value: next };
  }
  if (!state.birthDate) return bad("Conclua a primeira etapa antes.");
  if (input.step === 2) {
    if (input.skip) { if (!next.skipped.includes(2)) next.skipped.push(2); }
    else {
      const goals = validateGoals(input);
      if (!goals.ok) return goals;
      Object.assign(next, goals.value);
      next.skipped = next.skipped.filter((s) => s !== 2);
    }
    next.step = Math.max(state.step, 3) as 1 | 2 | 3;
    return { ok: true, value: next };
  }
  if (input.skip) { if (!next.skipped.includes(3)) next.skipped.push(3); }
  else {
    const routine = validateRoutine(input.routine, input.custom);
    if (!routine.ok) return routine;
    Object.assign(next, routine.value);
    next.skipped = next.skipped.filter((s) => s !== 3);
  }
  next.step = 3;
  next.completedAt = state.completedAt ?? nowIso;
  return { ok: true, value: next };
}
