import "server-only";
import { modules, questions } from "./catalog";
import type { Attempt, Session } from "./engine";
import type { OperacaoUser } from "./store";
import type { Discipline } from "./types";

const disciplines: Discipline[] = ["matematica", "fisica", "quimica", "biologia"];

/** Progresso real do aluno, calculado a partir do que foi persistido (nada é inventado). */
export async function loadProgress(user: OperacaoUser) {
  const [readRows, attemptRows, activeRows] = await Promise.all([user.kv.list<{ concluded: boolean }>("read"), user.kv.list<Attempt>("attempt"), user.kv.list<{ id: string }>("active")]);
  const reads = new Set(readRows.filter((r) => r.data.concluded).map((r) => r.ref));
  const attempts = new Map(attemptRows.map((r) => [r.ref, r.data]));
  const last = (id: string) => attempts.get(id)?.history.at(-1);
  const perDiscipline = disciplines.map((d) => {
    const ms = modules.filter((m) => m.discipline === d);
    const qs = questions.filter((q) => q.discipline === d);
    const answered = qs.filter((q) => attempts.has(q.id));
    return { discipline: d, modulesTotal: ms.length, modulesRead: ms.filter((m) => reads.has(m.id)).length, questionsTotal: qs.length, answered: answered.length, correct: answered.filter((q) => last(q.id)?.ok).length };
  });
  const activeSessions: { kind: string; id: string; answered: number; total: number }[] = [];
  for (const row of activeRows) {
    const s = await user.kv.get<Session>("session", row.data.id);
    if (s && !s.finishedAt) activeSessions.push({ kind: row.ref, id: s.id, answered: Object.keys(s.answers).length, total: s.questionIds.length });
  }
  const nextModule = modules.find((m) => !reads.has(m.id)) || null;
  const toReview = [...attempts.entries()].filter(([, a]) => a.history.at(-1)?.ok === false).length;
  return { reads, perDiscipline, nextModule, activeSessions, toReview, totalAnswered: attempts.size, totalCorrect: [...attempts.keys()].filter((id) => last(id)?.ok).length, hasAnyActivity: reads.size > 0 || attempts.size > 0 };
}
