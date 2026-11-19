import "server-only";
import { recordEventStatus } from "./record";

const MAX_NOTED = 5000;
const noted = new Set<string>();
/**
 * Primeira atividade pedagógica válida da conta (resposta registrada no servidor). Um registro por aluno (chave única no banco);
 * o Set só evita ida ao banco a cada resposta e é preenchido APÓS o sucesso, então uma falha é tentada de novo na próxima resposta.
 */
export function noteStudy(userId: string) {
  if (noted.has(userId) || userId === "dev-user") return;
  void recordEventStatus("first_study_completed", { userId, dedupeKey: userId }).then((status) => {
    if (status === "falhou") return;
    if (noted.size >= MAX_NOTED) noted.clear();
    noted.add(userId);
  });
}
