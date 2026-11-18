import { ApiError } from "../operacao/client";

export { ApiError };

/** POST para /api/trilha. Erros de rede e respostas de erro viram ApiError com mensagem legível. */
export async function post<T = unknown>(body: Record<string, unknown>): Promise<T> {
  let response: Response;
  try {
    response = await fetch("/api/trilha", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new ApiError("Sem conexão. Verifique sua internet e tente de novo.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data?.error || "Não foi possível concluir agora. Tente novamente.");
  return data as T;
}
