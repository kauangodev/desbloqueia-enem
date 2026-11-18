import "server-only";
import { modules, questions } from "./catalog";
import { todayInSaoPaulo } from "./config";
import { momentum } from "./momentum";
import { diagnose } from "./diagnostic";
import { isDue, type FlashState } from "./flash";
import { sessionKinds, type SessionKind } from "./kinds";
import type { Attempt, Session } from "./engine";
import type { OperacaoUser } from "./store";
import type { Discipline } from "./types";

const disciplines: Discipline[] = ["matematica", "fisica", "quimica", "biologia"];

/** Progresso real do aluno, calculado a partir do que foi persistido (nada é inventado). */
export async function loadProgress(user: OperacaoUser) {
  const [readRows, attemptRows, activeRows, sessionRows, flashRows] = await Promise.all([user.kv.list<{ concluded: boolean }>("read"), user.kv.list<Attempt>("attempt"), user.kv.list<{ id: string }>("active"), user.kv.list<Session>("session"), user.kv.list<FlashState>("flash")]);
  const reads = new Set(readRows.filter((r) => r.data.concluded).map((r) => r.ref));
  const attempts = new Map(attemptRows.map((r) => [r.ref, r.data]));
  const last = (id: string) => attempts.get(id)?.history.at(-1);
  const perDiscipline = disciplines.map((d) => {
    const ms = modules.filter((m) => m.discipline === d);
    const qs = questions.filter((q) => q.discipline === d);
    const answered = qs.filter((q) => attempts.has(q.id));
    return { discipline: d, modulesTotal: ms.length, modulesRead: ms.filter((m) => reads.has(m.id)).length, questionsTotal: qs.length, answered: answered.length, correct: answered.filter((q) => last(q.id)?.ok).length };
  });
  const activeSessions: { kind: string; id: string; answered: number; total: number; startedAt: string }[] = [];
  for (const row of activeRows) {
    const s = await user.kv.get<Session>("session", row.data.id);
    if (s && !s.finishedAt) activeSessions.push({ kind: row.ref, id: s.id, answered: Object.keys(s.answers).length, total: s.questionIds.length, startedAt: s.startedAt });
  }
  const nextModule = modules.find((m) => !reads.has(m.id)) || null;
  const toReview = [...attempts.entries()].filter(([, a]) => a.history.at(-1)?.ok === false).length;
  // Indicadores de avanço, todos derivados de ações verificadas e persistidas.
  const today = todayInSaoPaulo();
  const dayOf = (iso: string) => todayInSaoPaulo(new Date(iso));
  const answeredToday = new Set<string>();
  for (const [id, a] of attempts) if (a.history.some((h) => dayOf(h.at) === today)) answeredToday.add(id);
  const modulesReadToday = readRows.filter((r) => r.data.concluded && r.updatedAt && dayOf(r.updatedAt) === today).length;
  const firstTry = [...attempts.values()].filter((a) => a.firstTryCorrect === true).length;
  const recovered = [...attempts.values()].filter((a) => a.history.some((h) => !h.ok) && a.history.at(-1)?.ok).length;
  const finishedSessions = sessionRows.filter((r) => r.data.finishedAt);
  const finishedBy = (group: "treino" | "simulado") => finishedSessions.filter((r) => sessionKinds[r.data.kind as SessionKind]?.group === group).length;
  const practiced = attempts.size;
  const milestones = [10, 50, 100, 250, 500];
  const nextMilestone = milestones.find((m) => practiced < m) ?? null;
  const achievements = [
    { id: "modulo", label: "Primeiro módulo lido", done: reads.size >= 1 },
    { id: "q10", label: "10 questões praticadas", done: practiced >= 10 },
    { id: "recuperou", label: "Recuperou uma dificuldade", done: recovered >= 1 },
    { id: "treino", label: "Concluiu um treino", done: finishedBy("treino") >= 1 },
    { id: "simulado", label: "Concluiu um simulado", done: finishedBy("simulado") >= 1 },
  ];
  const gamification = { questionsToday: answeredToday.size, modulesReadToday, dailyGoal: 10, firstTry, recovered, practiced, nextMilestone, achievements };
  const attemptList = [...attempts.values()];
  // Revisões vencidas (cartões com data de hoje ou anterior) e lacunas do diagnóstico, para a ação principal do início.
  const flashDue = flashRows.filter((r) => isDue(r.data, today)).length;
  const weak = diagnose([...attempts.entries()].map(([id, a]) => ({ id, history: a.history })), questions.map((q) => ({ id: q.id, discipline: q.discipline, topic: q.topic })), today).weak;
  const rhythm = momentum({
    answerTimes: attemptList.flatMap((a) => a.history.map((h) => h.at)),
    firstAttemptTimes: attemptList.filter((a) => a.history.length).map((a) => a.history[0].at),
    moduleTimes: readRows.filter((r) => r.data.concluded && r.updatedAt).map((r) => r.updatedAt),
    sessionTimes: finishedSessions.map((r) => r.data.finishedAt as string),
    questionsToday: answeredToday.size,
    firstTryDays: attemptList.filter((a) => a.firstTryCorrect === true && a.history.length).map((a) => dayOf(a.history[0].at)),
    today,
    dailyGoal: gamification.dailyGoal,
  });
  return { gamification, momentum: rhythm, flashDue, weak, reads, perDiscipline, nextModule, activeSessions, toReview, totalAnswered: attempts.size, totalCorrect: [...attempts.keys()].filter((id) => last(id)?.ok).length, hasAnyActivity: reads.size > 0 || attempts.size > 0 };
}
