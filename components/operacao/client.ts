"use client";
import { useCallback, useEffect, useState } from "react";

export type AttemptSummary = { n: number; last: boolean | null; firstTry: boolean | null; everWrong: boolean; at?: string };
export type FinishedSession = { id: string; kind: string; mode: string; finishedAt: string; expired?: boolean; result: { total: number; answered: number; blank: number; correct: number; percent: number } };
export type OperacaoState = {
  attempts: Record<string, AttemptSummary>;
  fav: string[]; later: string[]; formulas: string[];
  reads: Record<string, boolean>; planMinutes: number | null; planDone: string[];
  reviewed: Record<string, boolean>; active: Record<string, string>; finished: FinishedSession[]; lastByKind?: Record<string, { percent: number; correct: number; total: number; finishedAt: string }>;
};

export class ApiError extends Error {}

export async function post<T = unknown>(body: Record<string, unknown>): Promise<T> {
  let response: Response;
  try {
    response = await fetch("/api/operacao", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new ApiError("Sem conexão. Verifique sua internet e tente de novo.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data?.error || "Não foi possível concluir agora. Tente novamente.");
  return data as T;
}

/** Estado persistido do aluno. `reload` busca de novo; `patch` atualiza otimista no cliente. */
export function useOperacaoState() {
  const [state, setState] = useState<OperacaoState | null>(null);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    try {
      const response = await fetch("/api/operacao", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Não foi possível carregar seu progresso.");
      if (!data || typeof data.active !== "object" || !data.attempts) throw new Error("Resposta inesperada ao carregar seu progresso. Atualize a página.");
      setState(data as OperacaoState); setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar seu progresso.");
    }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  const patch = useCallback((fn: (current: OperacaoState) => OperacaoState) => setState((current) => (current ? fn(current) : current)), []);
  return { state, error, reload, patch };
}

/** Leitura/escrita tolerante a falhas do armazenamento do navegador (apenas conveniência por dispositivo). */
export const local = {
  get(key: string) { try { return window.localStorage.getItem(key); } catch { return null; } },
  set(key: string, value: string) { try { window.localStorage.setItem(key, value); } catch { /* ignora */ } },
};
