import { levelFor, studyDate, summarizeStudyDays } from "../gamification-rules";

/**
 * Indicadores de ritmo do aluno (sequência, XP, nível, missões do dia), calculados só de ações verificadas e persistidas:
 * tentativas em questões, módulos concluídos e atividades finalizadas. Nada é inventado nem digitado pelo cliente.
 */
export type MomentumInput = {
  /** Instantes (ISO) de cada resposta registrada (qualquer tentativa): contam para sequência e atividade da semana. */
  answerTimes: string[];
  /** Instante (ISO) da PRIMEIRA tentativa de cada questão: só ela vale XP, para repetir a mesma questão não render pontos. */
  firstAttemptTimes: string[];
  /** Questões distintas respondidas hoje (qualquer tentativa), para a missão de questões. */
  questionsToday: number;
  /** Instantes (ISO) em que um módulo foi concluído. */
  moduleTimes: string[];
  /** Instantes (ISO) em que um treino/simulado foi finalizado. */
  sessionTimes: string[];
  /** Datas (YYYY-MM-DD) das primeiras tentativas corretas. */
  firstTryDays: string[];
  /** Data de hoje (YYYY-MM-DD, fuso de São Paulo). */
  today: string;
  /** Meta diária de questões. */
  dailyGoal: number;
};

export const XP_PER_ANSWER = 10;
export const XP_PER_MODULE = 30;
export const XP_PER_SESSION = 50;

const dayOf = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : studyDate(date);
};
const days = (list: string[]) => list.map(dayOf).filter((value): value is string => value !== null);

const addUtcDays = (iso: string, amount: number) => {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};

export type Mission = { id: string; title: string; detail: string; done: boolean; progress: number; target: number };

export function momentum(input: MomentumInput) {
  const answerDays = days(input.answerTimes);
  const moduleDays = days(input.moduleTimes);
  const sessionDays = days(input.sessionTimes);
  const allDays = [...answerDays, ...moduleDays, ...sessionDays];
  const { streak, studyDays } = summarizeStudyDays(allDays, input.today);
  const active = new Set(allDays);

  const xp = input.firstAttemptTimes.length * XP_PER_ANSWER + input.moduleTimes.length * XP_PER_MODULE + input.sessionTimes.length * XP_PER_SESSION;
  const level = levelFor(xp);
  const levelStart = (level.level - 1) * 100;

  // Últimos 7 dias (do mais antigo ao de hoje), para a tira de atividade.
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = addUtcDays(input.today, index - 6);
    return { date, studied: active.has(date), today: date === input.today, answers: answerDays.filter((value) => value === date).length };
  });

  const answersToday = Math.max(0, input.questionsToday);
  const modulesToday = moduleDays.filter((value) => value === input.today).length;
  const firstTryToday = input.firstTryDays.filter((value) => value === input.today).length;
  const missions: Mission[] = [
    { id: "questoes", title: `Resolver ${input.dailyGoal} questões`, detail: "Treino, questões ou erros: tudo conta.", done: answersToday >= input.dailyGoal, progress: Math.min(answersToday, input.dailyGoal), target: input.dailyGoal },
    { id: "modulo", title: "Concluir 1 revisão rápida", detail: "Leia um módulo até o fim e marque como concluído.", done: modulesToday >= 1, progress: Math.min(modulesToday, 1), target: 1 },
    { id: "primeira", title: "Acertar 3 de primeira", detail: "Acerto na 1ª tentativa, sem ver a resolução antes.", done: firstTryToday >= 3, progress: Math.min(firstTryToday, 3), target: 3 },
  ];

  const activeDays = [...active].sort();
  let bestStreak = 0;
  let run = 0;
  let previous = "";
  for (const day of activeDays) {
    run = previous && addUtcDays(previous, 1) === day ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    previous = day;
  }

  return {
    streak,
    bestStreak,
    activeDays,
    studyDays,
    studiedToday: active.has(input.today),
    xp,
    level: level.level,
    levelProgress: xp - levelStart,
    levelSize: 100,
    nextLevelXp: level.nextLevelXp,
    week,
    missions,
    missionsDone: missions.filter((mission) => mission.done).length,
    answersToday,
  };
}

export type Momentum = ReturnType<typeof momentum>;
