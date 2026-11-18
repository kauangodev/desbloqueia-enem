const chains = new Map<string, Promise<unknown>>();
/**
 * Serializa operações do mesmo aluno dentro do processo: a cota diária é lida, atualizada e gravada, e duas respostas simultâneas
 * não podem ler o mesmo uso. (Vale para um processo Node, que é a hospedagem atual; com várias instâncias seria preciso trava no banco.)
 */
export async function withUserLock<T>(userId: string, work: () => Promise<T>): Promise<T> {
  const previous = chains.get(userId) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(work);
  chains.set(userId, next);
  try { return await next; } finally { if (chains.get(userId) === next) chains.delete(userId); }
}