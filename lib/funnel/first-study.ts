import "server-only";
import { recordEvent } from "./record";

const noted = new Set<string>();
/** Primeira atividade pedagógica válida da conta (resposta registrada no servidor). Um registro por aluno; o Set evita ida ao banco a cada resposta. */
export function noteStudy(userId: string) {
  if (noted.has(userId) || userId === "dev-user") return;
  noted.add(userId);
  void recordEvent("first_study_completed", { userId, dedupeKey: userId });
}